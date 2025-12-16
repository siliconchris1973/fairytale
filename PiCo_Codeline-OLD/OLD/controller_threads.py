# controller.py
import utime

from config import (
    PROG_MODE_SOURCE
    , _DEBUG_CTRL as _DEBUG
    , _USE_ID3_TAG
    , _TIME_BETWEEN_TAG_CHECKS_IN_MS
    , _MISSES_BEFORE_TAG_LOST
    , _TIMEOUT_FOR_TAG_CHECK_IN_MS
    , t
)

# Das storage-Modul kapselt alle FS-Operationen
from storage import (
    pick_first_track
    , load_uid_state
    , save_uid_state
    , list_tracks_for_uid
)
# für ID3-Tags
import id3

class PlayerController:
    def __init__(self, display, nfc, audio, rtc, buttons, volume_reader, prog_switch_pin):
        if _DEBUG: print("[CTRL] initializing the controller")
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
        
        # Debug: Timing von audio.feed()
        self._last_feed_ms = None
        self._worst_feed_gap = 0
        
        # brauchen wir, um ein überspringen von Tracks zu verhindern
        self._last_alive = True
        
        # Drosselung für NFC-Polling & Fortschrittsanzeige
        self._last_progress_ms = utime.ticks_ms()
        self._last_progress_pct = -1
        
        self._next_presence_check_ms = utime.ticks_ms()
        self._presence_miss_count = 0
        
        # Events, die vom NFC-Thread gesetzt und im Main-Thread ausgewertet werden
        self._pending_new_uid = None
        self._pending_tag_lost = False
        
        if _USE_ID3_TAG:
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
    # Uhr / Datum im Footer aktualisieren
    def _update_clock(self):
        """Aktualisiert Uhrzeit und Datum im Display max. 1x pro Sekunde."""
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
                # RTC-/Display-Fehler sind nicht kritisch
                pass
    
    # feed aufdio while showing the max lag time we had
    def _feed_with_debug(self):
        now = utime.ticks_ms()
        gap = utime.ticks_diff(now, self._last_feed_ms)
        # ersten Messpunkt explizit ignorieren
        if self._last_feed_ms is not None:
            if gap > 50 and gap > self._worst_feed_gap:
                self._worst_feed_gap = gap
                print("[CTRL] worst feed gap so far (runtime):", self._worst_feed_gap, "ms")
        self._last_feed_ms = now
        return self.audio.feed()
    
    # check if we are in prog mode
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
        # Anzeige-Felder aus ID3-Kontrakt nutzen
        album  = self.meta.get("display_album") or self.meta.get("album") or self.current_uid or ""
        title  = self.meta.get("display_title") or self.meta.get("title")
        if not title and self.chapters:
            title = self.chapters[self.curr_index]
        author = self.meta.get("display_author") or self.meta.get("artist") or ""
        status = "Pause" if self.paused else "Play"  # Resume-Verhalten bleibt wie von dir gewünscht
        
        getattr(self.display, "set_author", lambda *_: None)(author)
        self.display.show_play(album, title or "", status)
    
    def _chapters_for(self, uid):
        """Liefert (album_dir, [kapiteldateien]) für eine gegebene UID."""
        album_dir, files = list_tracks_for_uid(uid, exts=(".mp3",))
        
        #def key(f: str) -> int:
        #    # numerischen Teil aus dem Dateinamen ziehen, z.B. "track006.mp3" -> 6
        #    digits = ""
        #    for ch in f:
        #        if ch.isdigit():
        #            digits += ch
        #        elif digits:
        #            # sobald nach einer Ziffer etwas anderes kommt, hören wir auf
        #            break
        #    if digits:
        #        try:
        #            return int(digits)
        #        except Exception:
        #            pass
        #    # Fallback: sehr große Zahl, damit "komische" Namen ans Ende rutschen
        #    return 999999
        #
        #chapters = sorted(files, key=key)
        chapters = files
        #if _DEBUG: print("[CTRL] tracks sorted", chapters)
        
        return album_dir, chapters
    
    def _load_book(self, uid):
        album_dir, chapters = self._chapters_for(uid)
        if not chapters:
            # Kein Album für diese UID -> definierter Fehlerzustand
            self.book_path = None
            self.chapters = []
            self.state = {}
            # Dieser UID-Zustand soll NICHT als "aktiver Tag" gelten
            self.current_uid = None
            self.playing = False
            self.paused = False
            
            # Einmalige Meldung
            self.display.show_status(
                t("NO_ALBUM", "No Album found"),
                uid,
            )
            if _DEBUG: print("[CTRL] Kein Album für uid gefunden:", uid)
            
            return False
        
        # --- Ab hier: Es gibt Kapitel, wir können weitermachen ---
        self.book_path = album_dir
        self.chapters = chapters
        
        self.state = load_uid_state(uid) or {}
        try:
            self.curr_index = self.chapters.index(
                self.state.get("chapter", "track001.mp3")
            )
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
        
        #if _DEBUG: print("[CTRL] start playback " + str(self._current_file()))
        try:
            self.meta = id3.read_id3(f)
        except Exception:
            self.meta = {"title": "", "album": "", "artist": "", "track": ""}
        
        self.offset = self.offset if resume else 0
        getattr(self.display, "set_progress_text", lambda *_: None)("0%")
        self.audio.start(f, self.offset)
        
        # Feed-Timing ab Start der Wiedergabe messen
        self._last_feed_ms = utime.ticks_ms()
        self._last_progress_pct = -1
        self._last_progress_ms = utime.ticks_ms()
        
        self._last_alive = True
        self.playing = True
        self.paused = False
        
        # Puffer vorfüllen – 5..8 schnelle feed()-Calls
        prefeed = 6
        for _ in range(prefeed):
            if not self.audio.feed():
                break
        
        self._display_now_playing()
    
    def _stop_play(self):
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
        self._display_now_playing()
    
    def _next_chapter(self):
        if not self.chapters:
            return
        self._stop_play()
        self.curr_index = min(len(self.chapters) - 1, self.curr_index + 1)
        self.offset = 0
        self._start_play(resume=False)
    
    def _prev_chapter(self):
        if not self.chapters:
            return
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
        """
        1. VS1053 füttern (damit keine Lücken entstehen)
        2. Track-Ende nur einmal behandeln
        3. Fortschritt und Display aktualisieren
        """
        # ------ 1) Zuerst füttern ------
        if _DEBUG:
            alive = self._feed_with_debug()
        else:
            alive = self.audio.feed()
        
        # Track zu Ende?
        if not alive and self._last_alive:
            # Ende nur beim Übergang alive -> dead behandeln
            #if not self._last_alive:
            #    # dieses Ende ist schon verarbeitet
            #    return
            # Initialisierung, falls Feld bislang noch nicht existiert
            self._last_alive = alive
            
            if self.curr_index < len(self.chapters) - 1:
                # nächster Track
                self.curr_index += 1
                self.offset = 0
                self._last_progress_pct = -1
                getattr(self.display, "set_progress_text", lambda *_: None)("0%")
                self._start_play(resume=False)
            else:
                # letztes Kapitel fertig
                self._stop_play()
                self.display.show_stop()
            return
        else:
            # Track läuft normal
            self._last_alive = True
        
        # ------ 2) Fortschritt nach dem Feed berechnen ------
        total = int(getattr(self.audio, "total_bytes", 0) or 0)
        if total > 0:
            now = utime.ticks_ms()
            pos = int(getattr(self.audio, "pos_bytes", 0) or 0)
            pct = int(pos * 100 / total)
            if pct < 0:
                pct = 0
            elif pct > 100:
                pct = 100
            
            # Fortschritt nur alle 300ms und nur bei Änderung anzeigen
            if pct != self._last_progress_pct and utime.ticks_diff(
                now, self._last_progress_ms
            ) >= 300:
                getattr(self.display, "set_progress_text", lambda *_: None)(f"{pct}%")
                self._last_progress_pct = pct
                self._last_progress_ms = now
    
    # ------------------------------
    # we now check about the tag here in the controller
    # ------------------------------
    def _check_tag_still_present(self, interval_ms=500, misses_to_lose=3, timeout_for_checks_ms=40):
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
        if _DEBUG: print("[CTRL] presence check NOW, next at", self._next_presence_check_ms)
        
        # Leichter PN532-Call mit kleinem Timeout
        try:
            present = self.nfc.is_tag_still_present(timeout_ms=timeout_for_checks_ms)
        except Exception as e:
            if _DEBUG: print("[CTRL] NFC presence check error:", e)
            present = True  # konservativ
        
        #try:
        #    uid = self.nfc.read_uid(timeout_ms=timeout_for_checks_ms)
        #    present = bool(uid and uid == self.current_uid)
        #except Exception as e:
        #    if _DEBUG: print("[CTRL] NFC presence check error:", e)
        #    # konservativ: lieber weiterspielen
        #    present = True
        
        if present:
            self._presence_miss_count = 0
            return True
        
        # Miss zählen
        self._presence_miss_count += 1
        if self._presence_miss_count >= misses_to_lose:
            self._presence_miss_count = 0
            return False
        
        return True
    
    # ------------------------------------------------------------------
    # Hauptloops: Core 0 (Audio/UI) und Core 1 (NFC)
    # ------------------------------------------------------------------
    def loop_main(self):
        """
        Loop für Core 0 (Hauptthread):
        - Audio füttern
        - Fortschritt anzeigen
        - Buttons auswerten
        - Lautstärke anwenden
        - Uhr aktualisieren
        - NFC-Events (neuer Tag, Tag verloren) verarbeiten

        KEIN direkter NFC-Zugriff hier!
        """
        
        if self._is_prog_mode():
            # Im Programmiermodus übernimmt main.py NFC + Display.
            # Läuft noch eine Wiedergabe, sauber stoppen.
            if self.playing:
                self._stop_play()
            # Uhr weiterpflegen, damit die Zeit im Prog-Mode stimmt.
            self._update_clock()
            utime.sleep_ms(5)
            return
        
        # ---------- Normalmodus ----------
        # 1) Audio füttern + Fortschritt anzeigen
        if self.playing and not self.paused:
            self._update_progress_and_feed()
        
        # 2) Buttons auswerten
        for ev in self.buttons.poll():
            if ev == "play_pause":
                self._pause_toggle()
            elif ev == "next":
                self._next_chapter()
            elif ev == "prev":
                self._prev_chapter()
            elif ev == "stop":
                self._restart()
        
        # 3) NFC-Events aus zweitem Thread verarbeiten
        # 3a) Tag verloren?
        if self._pending_tag_lost:
            if _DEBUG: print("[CTRL] handling pending TAG LOST in main loop")
            self._pending_tag_lost = False
            # Wiedergabe stoppen und Anzeige aktualisieren
            self._stop_play()
            self.display.show_stop()
            getattr(self.display, "set_progress_text", lambda *_: None)("")
            self.current_uid = None
            self.display.show_idle(t("WAIT_FOR_TAG", "Show Tag to play"))
        
        # 3b) Neuer Tag erkannt?
        if self._pending_new_uid is not None:
            uid = self._pending_new_uid
            self._pending_new_uid = None
            
            if _DEBUG: print("[CTRL] handling pending NEW UID in main loop:", uid)
            
            # Sicherheitshalber alte Wiedergabe stoppen
            if self.playing:
                self._stop_play()
            
            self.current_uid = uid
            # Präsenz-Check für dieses Tag zurücksetzen
            self._presence_miss_count = 0
            self._next_presence_check_ms = utime.ticks_add(
                utime.ticks_ms(), _TIME_BETWEEN_TAG_CHECKS_IN_MS
            )

            if self._load_book(uid):
                # Aktuell: immer von vorne beginnen
                self._start_play(resume=False)
            else:
                pass
        
        # 4) Lautstärke
        self._apply_volume_if_changed()
        
        # 5) Uhr im Footer
        self._update_clock()
        
        # 6) Kleine Pause, damit Core 0 nicht 100% rennt
        utime.sleep_us(500)
    
    def loop_nfc(self):
        """
        Loop für Core 1 (zweiter Thread/Kern):
        - NFC-Polling im Idle
        - Tag-Präsenz während der Wiedergabe prüfen
        
        WICHTIG:
        - KEIN Display-Zugriff
        - KEIN Audio-Zugriff
        - NUR self.nfc.* und Setzen von Flags (_pending_*)
        """
        if self._is_prog_mode():
            # Im Prog-Mode verwendet main.py den NFC-Reader direkt
            return
        
        # --- Fall 1: Es läuft bereits eine Wiedergabe -> nur Präsenzcheck ---
        if self.playing and self.current_uid:
            try:
                still_here = self._check_tag_still_present(
                    _TIME_BETWEEN_TAG_CHECKS_IN_MS,
                    _MISSES_BEFORE_TAG_LOST,
                    _TIMEOUT_FOR_TAG_CHECK_IN_MS,
                )
            except Exception as e:
                if _DEBUG: print("[CTRL] NFC error in presence check:", e)
                still_here = True  # konservativ
            
            if not still_here:
                # Tag gilt als verloren -> Event für Main-Loop setzen
                self._pending_tag_lost = True
            
            # check if 5 ms instead of 20 is better for audio
            utime.sleep_ms(5)
            return
        
        # --- Fall 2: Wir spielen nichts -> nach neuem Tag suchen ---
        try:
            uid = self.nfc.read_uid()
        except Exception as e:
            if _DEBUG: print("[CTRL] NFC read_uid error in loop_nfc: ", e)
            utime.sleep_ms(50)
            return
        
        if uid and uid != self.current_uid:
            if _DEBUG: print("[CTRL] loop_nfc detected NEW UID:", uid)
            self._pending_new_uid = uid
        
        # check if 5 ms instead of 20 is better for audio
        utime.sleep_ms(5)
    
    # Für Kompatibilität: altes loop() ruft jetzt loop_main() auf
    def loop(self):
        """Kompatibilität zu altem Code – nutzt jetzt loop_main()."""
        self.loop_main()
