# controller.py
import utime
# Das storage-Modul kapselt alle FS-Operationen
from storage import (
    pick_first_track,
    load_uid_state,
    save_uid_state,
    list_tracks_for_uid,
)
from config import PROG_MODE_SOURCE, _DEBUG, _TIME_BETWEEN_TAG_CHECKS_IN_MS, _MISSES_BEFORE_TAG_LOST, _TIMEOUT_FOR_TAG_CHECK_IN_MS  # Prog-Schalter-Quelle
import id3  # für ID3-Tags

USE_ID3_TAG = 1
_DEBUG = True  # ausführlicheres Debugging (Feed-Gaps etc.)


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
        
        # Debug: Timing von audio.feed()
        self._last_feed_ms = utime.ticks_ms()
        self._worst_feed_gap = 0
        
        # Drosselung für NFC-Polling & Fortschrittsanzeige
        self._last_progress_ms = utime.ticks_ms()
        self._last_progress_pct = -1
        
        self._next_presence_check_ms = utime.ticks_ms()
        self._presence_miss_count = 0
        
        if USE_ID3_TAG:
            self.meta = {"title": "", "album": "", "artist": "", "track": ""}
        
        # RTC-Anzeige initialisieren
        self._last_clock = utime.ticks_ms() - 10000
        self._clock_next = 0
        y, m, d, wd, hh, mm, ss = self.rtc.now()
        getattr(self.display, "set_time", lambda *_: None)("{:02d}:{:02d}".format(hh, mm))
        getattr(self.display, "set_date", lambda *_: None)("{:02d}.{:02d}.{:04d}".format(d, m, y))
    
    # ------------------------------------------------------------------
    # Hilfsfunktionen
    # ------------------------------------------------------------------
    def _feed_with_debug(self):
        now = utime.ticks_ms()
        gap = utime.ticks_diff(now, self._last_feed_ms)
        if gap > self._worst_feed_gap:
            self._worst_feed_gap = gap
            print("[CTRL] worst feed gap so far:", self._worst_feed_gap, "ms")
        self._last_feed_ms = now
        return self.audio.feed()
    
    def _is_prog_mode(self):
        src = (PROG_MODE_SOURCE or "PIN").upper()
        if src == "ACTIVE":
            return True
        if src == "INACTIVE":
            return False
        if self.prog_switch is None:
            return False
        return self.prog_switch.value() == 0  # active low
    
    # Use of ID3 Tag
    def _display_now_playing(self):
        book = self.meta.get("album") or self.current_uid or ""
        chapter = self.meta.get("title") or (self.chapters[self.curr_index] if self.chapters else "")
        status = "Pause" if self.paused else "Play"
        getattr(self.display, "set_author", lambda *_: None)(self.meta.get("artist") or "")
        self.display.show_play(book, chapter, status)
    
    def _chapters_for(self, uid):
        """Liefert (album_dir, [kapiteldateien]) für eine gegebene UID."""
        album_dir, files = list_tracks_for_uid(uid, exts=(".mp3",))
        
        def key(f):
            try:
                return int(f.split(".")[0])
            except Exception:
                return 999999
        
        return album_dir, sorted(files, key=key)
    
    def _load_book(self, uid):
        album_dir, chapters = self._chapters_for(uid)
        if not chapters:
            self.display.show_status("No Album", uid)
            print("[CTRL] Kein Album für uid gefunden:", uid)
            self.book_path = None
            self.chapters = []
            return False
        
        self.book_path = album_dir
        self.chapters = chapters
        
        self.state = load_uid_state(uid)
        try:
            self.curr_index = self.chapters.index(self.state.get("chapter", "track001.mp3"))
        except Exception:
            self.curr_index = 0
        self.offset = int(self.state.get("offset", 0) or 0)
        return True
    
    def _current_file(self):
        if not self.book_path:
            return None
        return "{}/{}".format(self.book_path, self.chapters[self.curr_index])
    
    def _apply_volume_if_changed(self):
        changed, pct = self.volume.changed()
        if changed:
            self.audio.set_volume(pct)
            self.display.show_volume(pct)
            self._vol_overlay_until = utime.ticks_add(utime.ticks_ms(), 1200)
    
    def _save_progress(self):
        if not self.current_uid or not self.chapters:
            return
        data = {
            "chapter": self.chapters[self.curr_index],
            "offset": self.offset,
            "volume": self.volume.last if getattr(self.volume, "last", None) is not None else 60,
        }
        save_uid_state(self.current_uid, data)
    
    def _start_play(self, resume=True):
        f = self._current_file()
        if not f:
            return
        
        if _DEBUG == True:
            print("[CTRL] start playback " + str(self._current_file()))
        try:
            self.meta = id3.read_id3(f)
        except Exception:
            self.meta = {"title": "", "album": "", "artist": "", "track": ""}
        
        if _DEBUG:
            print("[CTRL]", self.meta)
        self.offset = self.offset if resume else 0
        getattr(self.display, "set_progress_text", lambda *_: None)("0%")
        self.audio.start(f, self.offset)
        
        # Feed-Timing ab Start der Wiedergabe messen
        self._last_feed_ms = utime.ticks_ms()
        self._last_progress_pct = -1
        self._last_progress_ms = utime.ticks_ms()
        
        self.playing = True
        self.paused = False
        self._display_now_playing()
    
    def _stop_play(self):
        if _DEBUG == True:
            print("[CTRL] stop playback " + str(self._current_file()))
        off = self.audio.stop()
        self.offset = off
        self.playing = False
        self.paused = False
        self._save_progress()
    
    def _pause_toggle(self):
        if not self.playing:
            return
        if self.paused:
            self.audio.resume()
            self.paused = False
        else:
            self.audio.pause()
            self.paused = True
        self._vol_overlay_until = 0
        self._display_now_playing()
    
    def _next_chapter(self):
        if not self.chapters:
            return
        if _DEBUG == True:
            print("[CTRL] next chapter")
        self._stop_play()
        self.curr_index = min(len(self.chapters) - 1, self.curr_index + 1)
        self.offset = 0
        self._start_play(resume=False)
    
    def _prev_chapter(self):
        if not self.chapters:
            return
        if _DEBUG == True:
            print("[CTRL] prev chapter")
        self._stop_play()
        self.curr_index = max(0, self.curr_index - 1)
        self.offset = 0
        self._start_play(resume=False)
    
    def _restart(self):
        if not self.chapters:
            return
        self._stop_play()
        self.curr_index = 0
        self.offset = 0
        self._start_play(resume=False)
    
    def _update_progress_and_feed(self):
        pos = int(getattr(self.audio, "pos_bytes", 0) or 0)
        total = int(getattr(self.audio, "total_bytes", 0) or 0)
        
        now = utime.ticks_ms()
        if total > 0:
            pct = int(pos * 100 / total)
            if pct < 0:
                pct = 0
            elif pct > 100:
                pct = 100
            
            if pct != self._last_progress_pct and utime.ticks_diff(
                now, self._last_progress_ms
            ) >= 300:
                getattr(self.display, "set_progress_text", lambda *_: None)(f"{pct}%")
                self._last_progress_pct = pct
                self._last_progress_ms = now
        
        # VS1053 tatsächlich füttern
        if _DEBUG:
            alive = self._feed_with_debug()
        else:
            alive = self.audio.feed()
        
        if not alive:
            if self.curr_index < len(self.chapters) - 1:
                self.curr_index += 1
                self.offset = 0
                self._last_progress_pct = -1
                getattr(self.display, "set_progress_text", lambda *_: None)("0%")
                self._start_play(resume=False)
            else:
                self._stop_play()
                self.display.show_stop()
    
    # ------------------------------
    # we now check about the tag here in the controller
    # ------------------------------
    def _check_tag_still_present(self, interval_ms=500, misses_to_lose=3, timeout_for_checks_ms=60):
        """
        Wird NUR während der Wiedergabe verwendet.
        
        Strategie:
        - Nur alle `interval_ms` Millisekunden wird der PN532 wirklich abgefragt.
        - Die Abfrage nutzt nfc.read_uid(timeout_ms=10), also einen kurzen Timeout,
          damit audio.feed() nicht aus dem Takt kommt.
        - Wenn wir `misses_to_lose` mal hintereinander KEIN passendes UID sehen,
          gilt das Tag als "weg" und wir liefern False zurück.
        - Kurzfristige Funklöcher (einzelne Misses) führen NICHT zum Abbruch.
        """
        if not self.current_uid:
            # Kein aktives Tag -> aus Sicht der Wiedergabe "nichts zu tun"
            return True
        
        # Zeit für den nächsten Check?
        now = utime.ticks_ms()
        if utime.ticks_diff(now, self._next_presence_check_ms) < 0:
            # Noch nicht so weit -> Tag gilt vorerst als vorhanden
            return True
        
        # Nächsten Check in der Zukunft planen
        self._next_presence_check_ms = utime.ticks_add(now, interval_ms)
        
        # Leichter PN532-Call mit kleinem Timeout
        try:
            uid = self.nfc.read_uid(timeout_ms=timeout_for_checks_ms)
        except Exception:
            # Fehler beim Lesen -> NICHT sofort als "Tag weg" deuten
            return True
        
        if uid == self.current_uid:
            # Tag wie erwartet gesehen -> Miss-Counter zurücksetzen
            self._presence_miss_count = 0
            return True
        
        # Hier: kein UID oder anderes UID -> Miss hochzählen
        self._presence_miss_count += 1
        
        if self._presence_miss_count >= misses_to_lose:
            # Jetzt wirklich als "Tag verloren" betrachten
            self._presence_miss_count = 0
            return False
        
        # Noch nicht genügend Misses -> weiter optimistisch
        return True
    
    # ------------------------------------------------------------------
    # 2 Loops: 1 für Audio und einer für PN532 und Display
    # ------------------------------------------------------------------
    def loop(self):
        # Hauptschleife, nicht blockierend
        prog = self._is_prog_mode()
        
        if prog:
            # Im Programmiermodus übernimmt main.py die NFC- und Display-Logik.
            # Läuft noch eine Wiedergabe, sauber stoppen und Fortschritt speichern.
            if self.playing:
                self._stop_play()
            # Buttons / Volume / Audio-Feed im Prog-Mode ignorieren.
        
        else:
            # ---------- Normalmodus ----------
            
            # 1) Wenn wir bereits spielen: zuerst Audio füttern + Fortschritt updaten
            if self.playing:
                alive = self.audio.feed()
                
                # Fortschritt (in %) anzeigen, wenn verfügbar
                pos = int(getattr(self.audio, "pos_bytes", 0) or 0)
                total = int(getattr(self.audio, "total_bytes", 0) or 0)
                
                if total > 0:
                    pct = int(pos * 100 / total)
                    if pct < 0:
                        pct = 0
                    elif pct > 100:
                        pct = 100
                    getattr(self.display, "set_progress_text", lambda *_: None)(f"{pct}%")
                
                if not alive:
                    # Kapitel zu Ende → nächstes (falls vorhanden) automatisch
                    if self.curr_index < len(self.chapters) - 1:
                        self.curr_index += 1
                        self.offset = 0
                        getattr(self.display, "set_progress_text", lambda *_: None)("0%")
                        # Beim Start eines neuen Kapitels Präsenz-Check-Zustand zurücksetzen
                        self._presence_miss_count = 0
                        self._next_presence_check_ms = utime.ticks_add(utime.ticks_ms(), 500)
                        self._start_play(resume=False)
                    else:
                        # Buch zu Ende
                        self._stop_play()
                        self.display.show_stop()
                        self.display.show_idle("Warte auf Tag", "...")
                else:
                    # 2) Tag-Präsenz nur selten prüfen (non-blocking, mit kurzem Timeout)
                    if not self._check_tag_still_present(_TIME_BETWEEN_TAG_CHECKS_IN_MS, _MISSES_BEFORE_TAG_LOST, _TIMEOUT_FOR_TAG_CHECK_IN_MS):
                        # Tag gilt als weg -> Wiedergabe stoppen
                        self._stop_play()
                        self.display.show_stop()
                        getattr(self.display, "set_progress_text", lambda *_: None)("")
                        self.current_uid = None
                        self.display.show_idle("Warte auf Tag", "...")
                        utime.sleep_ms(20)
                        return
            
            # 3) NFC NUR im Idle pollen (nicht während Wiedergabe)
            if not self.playing:
                # Hier darf read_uid ruhig etwas "schwerer" sein, weil kein Audio läuft.
                uid = self.nfc.read_uid()
            else:
                # Während der Wiedergabe kein erneutes UID-Lesen – wir arbeiten mit current_uid
                uid = self.current_uid
            
            # 4) Neues Tag erkannt → Album laden & starten
            if uid and uid != self.current_uid:
                if self.playing:
                    self._stop_play()
                self.current_uid = uid
                
                # Präsenz-Check-Zustand für dieses neue Tag resetten
                self._presence_miss_count = 0
                self._next_presence_check_ms = utime.ticks_add(utime.ticks_ms(), 500)
                
                if self._load_book(uid):
                    # je nach gewünschtem Verhalten:
                    # - Resume ab letztem Stand:
                    #   self._start_play(resume=True)
                    # - Immer von vorne:
                    self._start_play(resume=False)
                else:
                    self.display.show_status("No Content", uid)
            
            # 5) Tag entfernt im Idle (wir spielen gerade NICHT)
            elif (not uid) and self.current_uid and not self.playing:
                getattr(self.display, "set_progress_text", lambda *_: None)("")
                self.current_uid = None
                self.display.show_idle("Warte auf Tag", "...")
            
            # 6) Buttons auswerten
            for ev in self.buttons.poll():
                if ev == "play_pause":
                    self._pause_toggle()
                elif ev == "next":
                    self._next_chapter()
                elif ev == "prev":
                    self._prev_chapter()
                elif ev == "stop":
                    self._restart()
            
            # 7) Volume
            self._apply_volume_if_changed()
        
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
