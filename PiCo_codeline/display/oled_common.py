# display/oled_common.py
# Gemeinsamer Rendering-Kern für 128x64 OLEDs (SSD1306/SH1106) mit 8x8 Font.
# Er erwartet ein "driver"-Objekt mit Methoden: fill(color), fill_rect(x,y,w,h,c),
# text(str, x, y, color), pixel(x,y,color optional), show(), width, height.

import framebuf
from config import (
                    t
                    , _DEBUG_DISP as _DEBUG
                    )

class OledUI:
    def _status_symbol(self, status):
        st = (status or "").lower()
        if st.startswith("pla"):   return ">"
        if st.startswith("pau"):   return "||"
        if st.startswith("sto"):   return "[]"
        if st.startswith("nex"):   return ">>"
        if st.startswith("pre"):   return "<<"
        return ""
    
    CHAR_W = 8
    CHAR_H = 8
    # 8x8 Symbole (Play, Pause, Stop) als 1-bit bitmaps
    _ICON_PLAY = bytes([
        0b00011000,
        0b00011100,
        0b00011110,
        0b00011111,
        0b00011110,
        0b00011100,
        0b00011000,
        0b00000000,
    ])
    _ICON_PAUSE = bytes([
        0b00110110,
        0b00110110,
        0b00110110,
        0b00110110,
        0b00110110,
        0b00110110,
        0b00110110,
        0b00000000,
    ])
    _ICON_STOP = bytes([
        0b00111100,
        0b00111100,
        0b00111100,
        0b00111100,
        0b00111100,
        0b00111100,
        0b00111100,
        0b00000000,
    ])
    def __init__(self, driver, keep_footer=True):
        self.drv = driver
        self.width = getattr(driver, "width", 128)
        self.height = getattr(driver, "height", 64)
        self.cols = self.width // self.CHAR_W
        self.rows = self.height // self.CHAR_H
        self._keep_footer = keep_footer
        
        # FrameBuffer für Symbole
        self._fb_play  = framebuf.FrameBuffer(bytearray(self._ICON_PLAY),  8, 8, framebuf.MONO_HLSB)
        self._fb_pause = framebuf.FrameBuffer(bytearray(self._ICON_PAUSE), 8, 8, framebuf.MONO_HLSB)
        self._fb_stop  = framebuf.FrameBuffer(bytearray(self._ICON_STOP),  8, 8, framebuf.MONO_HLSB)
        
        # UI-State
        self._album = ""
        self._trackno = ""
        self._artist = ""
        self._status = "Play"
        self._volume = 0
        self._time_str = ""   # "HH:MM"
        self._date_str = ""   # "DD.MM.YYYY"
        
        # show progress in bytes
        self._progress_str = ""
        
        # Footer immer unterste Zeile
        self._footer_y = self.CHAR_H * (self.rows - 1)

    # ---------- helpers ----------
    def _pad(self, s, w):
        s = "" if s is None else str(s)
        return s[:w] if len(s) >= w else s + (" " * (w - len(s)))

    def _text(self, s, x, y, c=1):
        self.drv.text(s, x, y, c)

    def _clear_all(self):
        self.drv.fill(0)

    def _clear_body(self):
        # alles außer Footer-Zeile löschen
        self.drv.fill_rect(0, 0, self.width, self._footer_y, 0)

    def _wrap_lines(self, text, maxcols, maxlines):
        if not text:
            return ["" for _ in range(maxlines)]
        words = str(text).split()
        lines, cur = [], ""
        for w in words:
            nxt = (cur + " " + w).strip()
            if len(nxt) <= maxcols:
                cur = nxt
            else:
                lines.append(cur)
                cur = w
                if len(lines) >= maxlines - 1:
                    break
        if cur or not lines:
            lines.append(cur[:maxcols])
        lines = (lines + [""] * maxlines)[:maxlines]
        return lines

    def _leading_digits(self, s):
        # extrahiert führende Ziffern
        if not s:
            return ""
        s = str(s)
        out = ""
        for ch in s:
            if ch.isdigit():
                out += ch
            else:
                break
        return out

    # ---------- sections ----------
    def _draw_volume_row(self):
        y = self._footer_y - self.CHAR_H  # direkt über Uhr/Datum
        # Row leeren
        self.drv.fill_rect(0, y, self.width, self.CHAR_H, 0)
        
        # Prozent rechts
        pct_txt = "{:>3}%".format(int(self._volume))
        pct_w = len(pct_txt) * self.CHAR_W
        self._text(pct_txt, self.width - pct_w, y)
        
        # Balken links bis vor Prozenttext - 1 Spalte
        bar_x = 0
        bar_w = max(4 * self.CHAR_W, self.width - pct_w - self.CHAR_W)
        bar_h = self.CHAR_H - 2
        bar_y = y + 1
        
        # Rahmen
        for dx in range(bar_w):
            self.drv.pixel(bar_x + dx, bar_y, 1)
            self.drv.pixel(bar_x + dx, bar_y + bar_h - 1, 1)
        for dy in range(bar_h):
            self.drv.pixel(bar_x, bar_y + dy, 1)
            self.drv.pixel(bar_x + bar_w - 1, bar_y + dy, 1)
        
        # Füllung
        pct = int(self._volume)
        if pct < 0: pct = 0
        if pct > 100: pct = 100
        fill = int((bar_w - 2) * pct / 100)
        if fill > 0:
            self.drv.fill_rect(bar_x + 1, bar_y + 1, fill, max(1, bar_h - 2), 1)
    
    def _draw_footer_time_date(self):
        y = self._footer_y
        self.drv.fill_rect(0, y, self.width, self.CHAR_H, 0)
        parts = []
        if self._time_str:
            parts.append(self._time_str[:5])
        if self._date_str:
            parts.append(self._date_str[:10])
        txt = " ".join(parts)
        if not txt:
            return
        x = self.width - len(txt) * self.CHAR_W
        if x < 0: x = 0
        self._text(txt, x, y)
    
    # ---------- public API ----------
    def set_time(self, hhmm):
        self._time_str = (hhmm or "")[:5]
        self._draw_footer_time_date()
        self.drv.show()
    
    def set_date(self, datestr):
        self._date_str = (datestr or "")[:10]
        self._draw_footer_time_date()
        self.drv.show()
    
    def set_progress_text(self, txt):
        self._progress_str = str(txt or "")
    
    def show_status(self, line1, line2=""):
        # Clean layout ohne invertierten Header
        if self._keep_footer: self._clear_body()
        else: self._clear_all()

        self._text(self._pad(line1, self.cols), 0, 0)
        if line2:
            self._text(self._pad(line2, self.cols), 0, self.CHAR_H)

        self._draw_footer_time_date()
        self.drv.show()
    
    def show_idle(self, msg1, msg2=""):
        # Idle wie Status
        self.show_status(msg1, msg2)
    
    def show_prompt_tag(self):
        # „Bitte NFC-Tag auflegen…“ als zwei Zeilen, clean
        if self._keep_footer: self._clear_body()
        else: self._clear_all()
        self._text(self._pad(oled_text['SHOW_TAG'], self.cols), 0, 0)
        self._draw_footer_time_date()
        self.drv.show()
    
    def show_play(self, album, trackno, artist, status="PLAY"):
        self._album   = str(album or "")
        self._trackno = str(trackno or "")
        self._artist  = str(artist or "")
        # status ist jetzt ein KEY ("PLAY", "PAUSE", "STOP", ...)
        self._status  = str(status or "PLAY")
        
        # Render
        if self._keep_footer:
            self._clear_body()
        else:
            self._clear_all()
        
        # 1–2: Album / Tag-ID
        lines = self._wrap_lines(self._album, self.cols, 2)
        y = 0
        for ln in lines:
            self._text(self._pad(ln, self.cols), 0, y)
            y += self.CHAR_H
        
        # 3: Track
        track_line = ""
        ld = self._leading_digits(self._trackno)
        if ld:
            track_line = "Track " + ld
        elif self._trackno:
            ttxt = str(self._trackno)
            if len(ttxt) > self.cols:
                track_line = ttxt[: self.cols]
            else:
                track_line = ttxt
        if track_line:
            self._text(self._pad(track_line, self.cols), 0, self.CHAR_H * 2)
        
        # 4: artist
        self._text(self._pad(self._artist or "", self.cols), 0, self.CHAR_H * 3)
        
        # Status-Zeile (eine Zeile über der Volume-Zeile)
        status_y = self._footer_y - self.CHAR_H * 2
        if status_y >= self.CHAR_H * 4:
            # Übersetzung über config.t()
            label = t(self._status, self._status)
            line  = label
            if getattr(self, "_progress_str", ""):
                line += " " + self._progress_str
            self._text(self._pad(line, self.cols), 0, status_y)
        
        # Volume + Footer
        self._draw_volume_row()
        self._draw_footer_time_date()
        self.drv.show()
    
    def show_volume(self, percent):
        # Nur Volumen + Footer aktualisieren
        try:
            p = int(percent)
        except:
            p = 0
        if p < 0: p = 0
        if p > 100: p = 100
        self._volume = p
        self._draw_volume_row()
        self._draw_footer_time_date()
        self.drv.show()
    
    def show_prog(self, uid, ip=None):
        # Programmiermodus: Tag + IP anzeigen, IP direkt über der Uhr
        if self._keep_footer:
            self._clear_body()
        else:
            self._clear_all()
        # Kopfzeilen
        self._text(self._pad(t("PROG_MODE", "Prog Mode"), self.cols), 0, 0)
        self._text(self._pad("UID: {}".format(uid), self.cols), 0, self.CHAR_H)
        
        # IP-Zeile direkt über Uhr/Datum (eine Zeile unterhalb von status/Album etc.)
        ip_y = self._footer_y - self.CHAR_H
        # Zeile erst leeren
        self.drv.fill_rect(0, ip_y, self.width, self.CHAR_H, 0)
        if ip:
            # Nur die IP selbst anzeigen – bei IPv4 max. 15 Zeichen, passt in 16 Spalten
            ip_txt = str(ip)[:self.cols]
            self._text(self._pad(ip_txt, self.cols), 0, ip_y)

        # Footer (Uhr/Datum) neu zeichnen
        self._draw_footer_time_date()
        self.drv.show()

