# controller.py
import utime
# the storage.py encapsulates all FS operations
from storage import (
    pick_first_track,
    load_uid_state,
    save_uid_state,
    list_tracks_for_uid,
)
from config import PROG_MODE_SOURCE  # bleibt wie gehabt weiter unten

USE_ID3_TAG = 1
import id3 # only needed for ID3 tag 

# to track down timing issues we generate more output with this setting
_DEBUG = True 

class PlayerController:
    def __init__(self, display, nfc, audio, rtc, buttons, volume_reader, prog_switch_pin):
        print("[CTRL] initializing the controller")
        self.display = display
        self.nfc = nfc
        self.audio = audio
        self.rtc = rtc
        self.buttons = buttons
        self.volume = volume_reader
        self.prog_switch = prog_switch_pin
        self.current_uid = None
        self.book_path = None
        self.chapters = []
        self.curr_index = 0
        self.offset = 0
        self.playing = False
        self.paused = False
        self.state = None
        self._vol_overlay_until = 0  # ms-Timestamp: bis wann Volume-Overlay sichtbar bleibt
        
        # for debugging purposes we measure the timing
        self._last_feed_ms = utime.ticks_ms()
        self._worst_feed_gap = 0
        
        # make sure to only update display and nfc so much to not interfere with audio loop
        self._last_progress_ms = utime.ticks_ms()
        self._last_progress_pct = -1
        
        self._last_uid_poll = utime.ticks_ms()
        
        if USE_ID3_TAG == 1:
            self.meta = {"title":"", "album":"", "artist":"", "track":""}
        
        # used for the RTC time display
        self._last_clock = utime.ticks_ms() - 10000
        self._clock_next = 0  # ms-Timestamp für nächstes Update
        y, m, d, wd, hh, mm, ss = self.rtc.now()
        getattr(self.display, "set_time", lambda *_: None)("{:02d}:{:02d}".format(hh, mm))
        getattr(self.display, "set_date", lambda *_: None)("{:02d}.{:02d}.{:04d}".format(d, m, y))
    
    def _feed_with_debug(self):
        now = utime.ticks_ms()
        gap = utime.ticks_diff(now, self._last_feed_ms)
        if gap > self._worst_feed_gap:
            self._worst_feed_gap = gap
            print("[DEBUG] worst feed gap so far:", self._worst_feed_gap, "ms")
        self._last_feed_ms = now
        return self.audio.feed()
    
    def _is_prog_mode(self):
        src = (PROG_MODE_SOURCE or "PIN").upper()
        if src == "ACTIVE":
            # programmierter Dauer-Prog-Mode
            return True
        if src == "INACTIVE":
            # programmierter Dauer-Normalmode
            return False
        # Default: "PIN" -> echten Schalter lesen
        if self.prog_switch is None:
            # falls mal None durchgereicht wird, sicherheitshalber Normalmode
            return False
        return self.prog_switch.value() == 0  # active low
    
    # Use of ID3 Tag
    def _display_now_playing(self):
        # Hörbuchname bevorzugt aus ID3 (Album), sonst UID
        book = self.meta.get("album") or self.current_uid or ""
        # Kapiteltitel bevorzugt aus ID3 (Title), sonst Dateiname
        chapter = self.meta.get("title") or (self.chapters[self.curr_index] if self.chapters else "")
        status = "Pause" if self.paused else "Play"
        getattr(self.display, 'set_author', lambda *_: None)(self.meta.get('artist') or '')
        self.display.show_play(book, chapter, status)
        if _DEBUG == True:
            print("[CTRL] " + str(self.meta))
    
    def _chapters_for(self, uid):
        """Liefert (album_dir, [kapiteldateien]) für eine gegebene UID.
        Die Kapitel werden numerisch nach Dateinamen (z.B. 001.mp3, 010.mp3) sortiert.
        Das Filesystem wird dabei ausschließlich über storage.list_tracks_for_uid() angesprochen.
        """
        album_dir, files = list_tracks_for_uid(uid, exts=(".mp3",))
        # numerisch sortieren, erwartetes Format 001.mp3 etc.
        def key(f):
            try:
                return int(f.split('.')[0])
            except:
                return 999999
        return album_dir, sorted(files, key=key)
    
    def _load_book(self, uid):
        # Kapitel und Album-Verzeichnis ausschließlich über storage-API ermitteln
        album_dir, chapters = self._chapters_for(uid)
        if not chapters:
            # kein Verzeichnis oder keine MP3-Dateien gefunden
            self.display.show_status("No Album", uid)
            if _DEBUG == True:
                print("[CTRL] Kein Album für uid gefunden: ", uid)
            self.book_path = None
            self.chapters = []
            return False
        
        self.book_path = album_dir
        self.chapters = chapters
        
        # Persistierten State (Kapitel/Offset/Volume) über storage lesen
        self.state = load_uid_state(uid)
        # Kapitel aus State wählen
        try:
            self.curr_index = self.chapters.index(self.state.get("chapter", "001.mp3"))
        except ValueError:
            self.curr_index = 0
        self.offset = int(self.state.get("offset", 0) or 0)
        return True
    
    def _current_file(self):
        if not self.book_path: return None
        return "{}/{}".format(self.book_path, self.chapters[self.curr_index])
    
    def _apply_volume_if_changed(self):
        changed, pct = self.volume.changed()
        if changed:
            self.audio.set_volume(pct)
            # Overlay anzeigen und für 1.2s halten
            self.display.show_volume(pct)
            self._vol_overlay_until = utime.ticks_add(utime.ticks_ms(), 1200)
    
    def _save_progress(self):
        if not self.current_uid or not self.chapters: return
        # hole letzten Offset aus Audio-Engine:
        # Hinweis: stop() liefert off; beim Pausieren speichern wir separat.
        data = {
            "chapter": self.chapters[self.curr_index],
            "offset": self.offset,
            "volume": self.volume.last if self.volume.last is not None else 60
        }
        # State ausschließlich über storage speichern
        save_uid_state(self.current_uid, data)
    
    def _start_play(self, resume=True):
        f = self._current_file()
        if not f: return
        # ID3 lesen
        try:
            self.meta = id3.read_id3(f)
        except:
            self.meta = {"title":"", "album":"", "artist":"", "track":""}
        
        off = self.offset if resume else 0
        getattr(self.display, "set_progress_text", lambda *_: None)("0%")
        self.audio.start(f, off)
        self._last_progress_pct = -1
        self._last_progress_ms = utime.ticks_ms()
        self.playing = True
        self.paused = False
        self._display_now_playing()
    
    def _stop_play(self):
        off = self.audio.stop()
        # offset mitschreiben
        self.offset = off
        self.playing = False
        self.paused = False
        self._save_progress()
    
    def _pause_toggle(self):
        if not self.playing: return
        if self.paused:
            self.audio.resume()
            self.paused = False
        else:
            self.audio.pause()
            self.paused = True
        # Volume-Overlay ggf. abbrechen, damit der Play/Pause-Status sichtbar wird
        self._vol_overlay_until = 0
        self._display_now_playing()
    
    def _next_chapter(self):
        if not self.chapters: return
        self._stop_play()
        self.curr_index = min(len(self.chapters)-1, self.curr_index+1)
        self.offset = 0
        self._start_play(resume=False)
    
    def _prev_chapter(self):
        if not self.chapters: return
        self._stop_play()
        self.curr_index = max(0, self.curr_index-1)
        self.offset = 0
        self._start_play(resume=False)
    
    def _restart(self):
        if not self.chapters: return
        self._stop_play()
        self.curr_index = 0
        self.offset = 0
        self._start_play(resume=False)
    
    def _update_progress_and_feed(self):
        # Fortschritt berechnen
        pos   = int(getattr(self.audio, "pos_bytes", 0) or 0)
        total = int(getattr(self.audio, "total_bytes", 0) or 0)
        
        now = utime.ticks_ms()
        if total > 0:
            pct = int(pos * 100 / total)
            if   pct < 0:   pct = 0
            elif pct > 100: pct = 100
            
            # Display NUR updaten, wenn sich etwas *sichtbar* geändert hat
            # und nicht öfter als z.B. alle 300 ms
            if pct != self._last_progress_pct and utime.ticks_diff(now, self._last_progress_ms) >= 300:
                getattr(self.display, "set_progress_text", lambda *_: None)(f"{pct}%")
                self._last_progress_pct = pct
                self._last_progress_ms = now
        
        # VS1053 füttern
        if _DEBUG == True:
            alive = self._feed_with_debug()
        else:
            alive = self.audio.feed()
        
        if not alive:
            # Kapitel zu Ende → nächstes oder stoppen
            if self.curr_index < len(self.chapters) - 1:
                self.curr_index += 1
                self.offset = 0
                self._last_progress_pct = -1
                getattr(self.display, "set_progress_text", lambda *_: None)("0%")
                self._start_play(resume=False)
            else:
                self._stop_play()
                self.display.show_stop()
       
    def loop(self):
        # Hauptschleife, nicht blockierend
        prog = self._is_prog_mode()
        
        # 1. Wenn gerade abgespielt wird: zuerst Audio füttern + Progress berechnen
        if not prog and self.playing:
            self._update_progress_and_feed()
        
        if prog:
            # Im Programmiermodus übernimmt main.py die NFC- und Display-Logik.
            # Läuft noch eine Wiedergabe, sauber stoppen und Fortschritt speichern.
            if self.playing:
                self._stop_play()
            # Buttons / Volume / Audio-Feed im Prog-Mode ignorieren.
        else:
            # ---------- Normalmodus ----------
            now = utime.ticks_ms()
            uid = None
            # UID nur alle ~150 ms polling → genug, um Tag-Wechsel zu bemerken,
            # aber nicht in *jedem* Loop NFC-Overhead
            if utime.ticks_diff(now, self._last_uid_poll) >= 150:
                self._last_uid_poll = now
                uid = self.nfc.read_uid()
            else:
                uid = self.current_uid  # "kein neues Ergebnis"
            
            if uid and uid != self.current_uid:
                # Neues Hörbuch laden
                if self.playing:
                    self._stop_play()
                self.current_uid = uid
                if self._load_book(uid):
                    self._start_play(resume=True)
                else:
                    self.display.show_status("No Content", uid)
            elif (not uid) and self.current_uid:
                # Tag entfernt -> stoppen & speichern
                if self.playing:
                    self._stop_play()
                    self.display.show_stop()
                    utime.sleep_ms(600)  # kurze Einblendung
                # Progress-Anzeige zurücksetzen
                getattr(self.display, "set_progress_text", lambda *_: None)("")
                self.current_uid = None
                self.display.show_idle("Waiting for Tag", "")
            
            # Buttons auswerten
            for ev in self.buttons.poll():
                if ev == "play_pause":
                    self._pause_toggle()
                elif ev == "next":
                    self._next_chapter()
                elif ev == "prev":
                    self._prev_chapter()
                elif ev == "stop":
                    self._restart()
            
            # Volume (nur im Normalmodus)
            self._apply_volume_if_changed()
            
            # Fortschritt + feed nur, wenn tatsächlich gespielt wird
            #if self.playing:
            #    # for debug purposes
            #    if _DEBUG == True:
            #        alive = self._feed_with_debug()
            #    
            #    pos   = int(getattr(self.audio, "pos_bytes", 0) or 0)
            #    total = int(getattr(self.audio, "total_bytes", 0) or 0)
            #    if _DEBUG == True:
            #        print("position: " + str(pos) + "/" + str(total))
            #        
            #    if total > 0:
            #        pct = int(pos * 100 / total)
            #        if   pct < 0:   pct = 0
            #        elif pct > 100: pct = 100
            #        getattr(self.display, "set_progress_text", lambda *_: None)(f"{pct}%")
            #        # Wenn total == 0 → unbekannt, alten Wert stehen lassen
            #    
            #    alive = self.audio.feed()
            #    if not alive:
            #        # Kapitel zu Ende → nächstes (falls vorhanden) automatisch
            #        if self.curr_index < len(self.chapters) - 1:
            #            self.curr_index += 1
            #            self.offset = 0
            #            getattr(self.display, "set_progress_text", lambda *_: None)("0%")
            #            self._start_play(resume=False)
            #        else:
            #            self._stop_play()
            #            self.display.show_stop()
         
        # ---------- Uhr im Footer (in beiden Modi) ----------
        now_ms = utime.ticks_ms()
        if utime.ticks_diff(now_ms, self._last_clock) >= 1000:
            self._last_clock = now_ms
            try:
                y, m, d, wd, hh, mm, ss = self.rtc.now()
                if hasattr(self.display, "set_time"):
                    self.display.set_time("{:02d}:{:02d}".format(hh, mm))
                if hasattr(self.display, "set_date"):
                    self.display.set_date("{:02d}.{:02d}.{:04d}".format(d, m, y))
            except Exception:
                pass
        
        utime.sleep_ms(5)
