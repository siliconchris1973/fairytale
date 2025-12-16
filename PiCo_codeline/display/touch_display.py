# display/touch_display.py
# Einfaches Touch-UI für 2. Bildschirm (TFT + Touch).
# Erwartet:
#   screen: Objekt mit .width, .height, .fill(color), .fill_rect(x,y,w,h,color),
#           .text(str,x,y[,color]), .blit(img, x, y) (img = framebuffer/bitmap)
#   touch:  Objekt mit .get_touch() -> (x, y, pressed_bool)  (XPT2046 o.ä.)
#
# Integration:
#   ui = TouchScreenUI(screen, touch, audio_root=AUDIO_ROOT,
#                      on_select=lambda path: controller.play_album_path(path))
#   -> in main loop regelmäßig ui.loop() aufrufen (z. B. jede 30–50 ms)
#
# Album-Metadaten:
#   - bevorzugt "album.txt" im Album-Ordner:
#         1. Zeile: Album: <Albumname>
#         2. Zeile: Interpret: <Interpret>
#   - sonst erste MP3 ID3 (rudimentär; Album/Artist aus v2 TIT2/TALB/TPE1, fallback sehr simpel)
#   - sonst Ordnername

import os, utime
from config import _DEBUG_DISP as _DEBUG

# ---- kleine Hilfen ---------------------------------------------------------
def _safe_str(s):
    try:
        return "" if s is None else str(s)
    except:
        return ""

def _startswith_any(name, prefixes):
    n = name.lower()
    for p in prefixes:
        if n.startswith(p):
            return True
    return False

def _is_image(fname):
    return fname.lower().endswith((".bmp", ".jpg", ".jpeg", ".png"))

def _read_album_txt(dirpath):
    """Liest 'album.txt' -> (album, artist) oder (None, None)."""
    for cand in ("album.txt", "Album.txt", "info.txt"):
        p = dirpath + "/" + cand
        try:
            with open(p, "r") as f:
                lines = [l.strip() for l in f.readlines() if l.strip()]
            album, artist = None, None
            for ln in lines:
                if ln.lower().startswith("album:"):
                    album = ln.split(":", 1)[1].strip()
                elif ln.lower().startswith(("interpret:", "artist:")):
                    artist = ln.split(":", 1)[1].strip()
            if album or artist:
                return album or None, artist or None
        except:
            pass
    return None, None

def _first_mp3(dirpath):
    try:
        for ent in os.ilistdir(dirpath):
            name = ent[0]
            if name.lower().endswith(".mp3"):
                return dirpath + "/" + name
    except:
        pass
    return None

def _read_id3_tiny(mp3_path):
    """Minimaler ID3v2 Reader (ohne Vollständigkeit); liefert (album, artist, title, apic_bytes_or_None)."""
    try:
        with open(mp3_path, "rb") as f:
            head = f.read(10)
            if len(head) < 10 or head[:3] != b"ID3":
                return None, None, None, None
            tag_size = (head[6]&0x7F)<<21 | (head[7]&0x7F)<<14 | (head[8]&0x7F)<<7 | (head[9]&0x7F)
            data = f.read(tag_size)
        # sehr grob: Frames durchsuchen
        album, artist, title, apic = None, None, None, None
        i = 0
        while i + 10 <= len(data):
            fid = data[i:i+4]
            size = (data[i+4]<<24)|(data[i+5]<<16)|(data[i+6]<<8)|data[i+7]
            # flags = data[i+8:i+10]
            i += 10
            if size <= 0 or i + size > len(data):
                break
            payload = data[i:i+size]
            i += size

            if fid in (b"TALB", b"TPE1", b"TIT2", b"APIC"):
                enc = payload[0] if len(payload)>0 else 0
                txt = None
                if fid != b"APIC":
                    # Text-Frames: headerbyte=encoding, dann text
                    try:
                        if enc == 0: txt = payload[1:].decode("latin1", "ignore")
                        elif enc == 1: txt = payload[1:].decode("utf-16", "ignore")
                        else: txt = payload[1:].decode("latin1", "ignore")
                    except:
                        txt = None
                if fid == b"TALB" and txt: album = txt
                elif fid == b"TPE1" and txt: artist = txt
                elif fid == b"TIT2" and txt: title = txt
                elif fid == b"APIC" and apic is None:
                    # APIC: enc, mime, pic_type, desc, data
                    # einfache Heuristik: suche erste 2 Null-Bytes und nimm rest
                    try:
                        # mime endet mit 0, danach 1 byte pic_type, dann desc \x00, dann Bild
                        # tolerant: suche letztes 0x00 2x
                        p = payload
                        # skip encoding byte
                        p = p[1:]
                        # mime bis 0
                        z = p.find(b"\x00")
                        if z != -1:
                            p = p[z+1:]
                            # skip pic_type
                            if len(p) > 0:
                                p = p[1:]
                            # desc bis 0
                            z2 = p.find(b"\x00")
                            if z2 != -1:
                                apic = p[z2+1:]
                            else:
                                apic = None
                    except:
                        apic = None
        return album, artist, title, apic
    except:
        return None, None, None, None

def _find_cover_bytes_or_path(dirpath, mp3_hint=None):
    """Suche cover.jpg/png/bmp im Ordner; wenn nicht, versuche APIC der mp3."""
    # 1) Dateisystem
    try:
        imgs = []
        for ent in os.ilistdir(dirpath):
            name = ent[0]
            if _is_image(name) and _startswith_any(name, ("cover", "folder", "front")):
                imgs.append(dirpath + "/" + name)
        if imgs:
            return None, imgs[0]  # (bytes, path)
        # sonst irgendein Bild
        for ent in os.ilistdir(dirpath):
            name = ent[0]
            if _is_image(name):
                return None, dirpath + "/" + name
    except:
        pass
    # 2) APIC aus MP3
    mp3 = mp3_hint or _first_mp3(dirpath)
    if mp3:
        _, _, _, apic = _read_id3_tiny(mp3)
        if apic:
            return apic, None
    return None, None

# ---- TouchScreenUI ---------------------------------------------------------
class TouchScreenUI:
    BG = 0
    FG = 1
    
    def __init__(self, screen, touch, audio_root="/sd", on_select=None):
        self.sc = screen
        self.tp = touch
        self.audio_root = audio_root
        self.on_select = on_select  # callback(album_path)
        
        self.W = getattr(screen, "width", 240)
        self.H = getattr(screen, "height", 320)
        
        # Browser-Cache
        self.albums = []   # list of dicts: {name, artist, path, sort_key}
        self.scroll = 0    # top index
        self.row_h  = 24
        self.alpha_bar_h = 24
        self.list_area_h = self.H - self.alpha_bar_h
        
        # NowPlaying
        self.cover_fb = None  # optional framebuffer
        self.cover_path = None
        self.state = "idle"   # "idle" | "play"
        
        self._scan_albums()
        self._render_idle()
    
    # ---- Public API: vom Controller aufrufen -------------------------------
    def show_prompt_tag(self):
        self.state = "idle"
        self._render_idle()
    
    def show_play(self, album, track, status="Play"):
        # album=ordnername, wir suchen cover + evtl. album.txt für hübsche Anzeige
        self.state = "play"
        # Versuche Cover aus aktuellem Albumverzeichnis (album=UID oder Name → wir suchen Pfad per Match)
        path = self._guess_album_path_from_name(album) or self.audio_root
        apic, img_path = _find_cover_bytes_or_path(path)
        self.cover_fb = None
        self.cover_path = img_path
        # Render
        self._render_now_playing(title=_safe_str(album), subtitle=_safe_str(track))
    
    def show_status(self, l1, l2=""):
        # Für Touch-Bildschirm genügt minimaler Status-Hinweis im Idle
        self.state = "idle"
        self._render_idle(header=_safe_str(l1), sub=_safe_str(l2))
    
    def set_time(self, hhmm): pass
    def set_date(self, date): pass
    def show_volume(self, pct): pass
    def set_author(self, author): pass
    def set_progress_text(self, txt): pass
    def show_prog(self, uid, ip=None):
        self.state = "idle"
        self._render_idle(header="Program-Mode", sub="UID: {}".format(uid))
    
    # ---- Loop (bitte regelmäßig im main loop aufrufen) ---------------------
    def loop(self):
        x, y, pressed = self._read_touch()
        if not pressed:
            return
        if self.state == "idle":
            # alpha bar?
            if y >= (self.H - self.alpha_bar_h):
                self._handle_alpha_bar_tap(x, y)
                return
            # list tap?
            idx = (y // self.row_h) + self.scroll
            if 0 <= idx < len(self.albums):
                album = self.albums[idx]
                # markieren & starten
                self._highlight_row(idx - self.scroll)
                if self.on_select:
                    self.on_select(album["path"])
        else:
            # now-playing: tap → (später Play/Pause/Next/Prev Icons etc.)
            pass
    
    # ---- Rendering ---------------------------------------------------------
    def _render_idle(self, header=None, sub=None):
        sc = self.sc
        sc.fill(self.BG)
        y = 0
        # optional Kopf
        if header:
            sc.fill_rect(0, 0, self.W, self.row_h, 1)
            sc.text(header[:28], 4, 4, 0)
            y += self.row_h
        if sub:
            sc.text(sub[:32], 4, y+4, 1)
            y += self.row_h
        
        # Liste
        self.list_area_h = self.H - self.alpha_bar_h - y
        visible_rows = max(1, self.list_area_h // self.row_h)
        for i in range(visible_rows):
            idx = self.scroll + i
            if idx >= len(self.albums):
                break
            a = self.albums[idx]
            line = "{} — {}".format(a["name"], a["artist"]) if a["artist"] else a["name"]
            sc.text(line[:40], 4, y + i*self.row_h + 4, 1)
        
        # Alphabet-Leiste
        self._draw_alpha_bar()
        # (kein double-buffer → direkt sichtbar)
    
    def _render_now
