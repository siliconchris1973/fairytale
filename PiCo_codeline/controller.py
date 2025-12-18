# controller.py
import utime
import json
try:
    import _thread
except Exception:
    _thread = None

from config import (
                    PROG_MODE_SOURCE
                    , _DEBUG_CTRL as _DEBUG
                    , _USE_ID3_TAG
                    , t
                    )

import id3  # für ID3-Tags

class PlayerController: 
    def __init__(self
                 , display
                 , audio
                 , storage
                 , rtc
                 , buttons
                 , triggers
                 , volume):
        self.audio = audio
        self.display = display
        self.rtc = rtc
        self.volume = volume
        self.triggers = triggers or []
        self.storage=storage
        
        self.play_state = "IDLE"
        self.resume_state = {}    # für UID-State
        self.current_uid = None
        self.track_files = []
        self.track_index = 0
        self.offset = 0
        
        self._last_vol_set_ms = 0
        self._last_vol_pct = None
        
        # Display/meta
        self.meta = {"title": "", "album": "", "artist": "", "track": ""} if _USE_ID3_TAG else None
        
        # Timing / UI updates
        self._last_clock_s = -1
        self._last_progress_ms = 0
        self._last_progress_pct = None
        
        # --- audio thread safety / multicore feed support ---
        self._audio_lock = _thread.allocate_lock() if _thread else None
        
        # --- lazy id3 support ---
        self._id3_pending_path = None
        self._id3_pending_set_ms = 0
        
        # init clock display immediately
        self._update_clock(force=True)
        
    # -------------------------------------------------
    # Hauptloop (Single Thread)
    # -------------------------------------------------
    def loop(self):
        # Core0 macht UI/Trigger/Clock/Volume + Progress read-only
        if self.play_state == "PLAY":
            self._update_progress_only()
            self._maybe_load_id3_lazy()
        
        self._handle_triggers()
        self._update_clock()
        self._apply_volume_if_changed()
        
        utime.sleep_ms(2)
    
    def stop(self):
        # entspricht STOP-Trigger
        self._handle_stop()
    def start(self, uid):
        # entspricht START-Trigger
        self._handle_start(uid)
    
    # -------------------------------------------------
    # Trigger-Verarbeitung
    # -------------------------------------------------
    def _handle_triggers(self):
        for trg in self.triggers:
            try:
                ev = trg.poll(self.play_state)
            except TypeError:
                ev = trg.poll()
            
            if not ev:
                continue
            
            kind, value = ev
            
            if kind == "start":
                self._handle_start(value)
                return
            if kind == "stop":
                self._handle_stop()
                return
            if kind == "play_pause":
                self._pause_toggle()
                return
            if kind == "next":
                self._next_chapter()
                return
            if kind == "prev":
                self._prev_chapter()
                return
    
    def _handle_start(self, uid):
        if self.play_state == "PLAY":
            return
        
        if _DEBUG: print("[CTRL] START triggered for UID", uid)
        
        self.current_uid = uid
        if not self._load_book(uid):
            if _DEBUG: print("[CTRL] Error: no content for uid found")
            self.display.show_status("No Content", uid)
            return
        
        self._start_play(resume=True)
    
    def _handle_stop(self, show_idle=True):
        if _DEBUG: print("[CTRL] STOP triggered")
        
        if self.play_state == "PLAY":
            self._stop_play()
        
        if show_idle:
            self.display.show_idle(t("WAIT_FOR_TAG", "Show Tag to play"))
    
    # ----------------------------
    # Storage + state + chapters
    # ----------------------------
    def _chapters_for(self, uid):
        """Return (album_dir, [chapter_filenames]) for a given uid."""
        album_dir, tracks = self.storage.list_tracks_for_uid(uid, exts=(".mp3",))
        #album_dir, files = self._list_tracks_for_uid(uid, exts=(".mp3",))
        #if not tracks:
        #    return album_dir, []
        #
        # sort by numeric prefix if possible, otherwise by name
        #def num_key(name):
        #    try:
        #        return int(name.split(".", 1)[0])
        #    except Exception:
        #        return 999999
        #
        #files_sorted = sorted(tracks, key=lambda f: (num_key(f), f))
        return album_dir, tracks
    
    def _load_book(self, uid):
        album_dir, chapters = self._chapters_for(uid)
        if not chapters:
            if _DEBUG: print("[CTRL] No album for uid:", uid)
            self.book_path = None
            self.track_files = []
            return False
        
        self.book_path = album_dir
        self.track_files = chapters
        
        # Load persisted state for this UID
        self.resume_state = self.storage.load_uid_state(uid) or {}
        
        # legacy schema: {"chapter": "track001.mp3", "offset": 0, "volume": 60}
        chapter_name = self.resume_state.get("chapter", chapters[0])
        try:
            self.track_index = self.track_files.index(chapter_name)
        except Exception:
            self.track_index = 0
        
        try:
            self.offset = int(self.resume_state.get("offset", 0) or 0)
        except Exception:
            self.offset = 0
        
        # restore volume (best-effort)
        vol = self.resume_state.get("volume", None)
        if vol is not None and self.volume is not None:
            try:
                vol = int(vol)
                if vol < 0: vol = 0
                if vol > 100: vol = 100
                self.audio.set_volume(vol)     # KEINE weitere Umrechnung hier
                self.volume.last = vol
            except Exception:
                pass
        
        return True
    
    def _save_progress(self):
        if not self.current_uid or not self.track_files:
            return
        data = {
            "chapter": self.track_files[self.track_index],
            "offset": int(self.offset or 0),
            "volume": int(getattr(self.volume, "last", 60) or 60),
        }
        try:
            self.storage.save_uid_state(self.current_uid, data)
        except Exception as e:
            if _DEBUG: print("[CTRL] save_uid_state failed:", e)
    
    # ----------------------------
    # Audio control
    # ----------------------------
    def _current_file(self):
        if not self.book_path or not self.track_files:
            return None
        return "{}/{}".format(self.book_path.rstrip("/"), self.track_files[self.track_index])
    
    def _display_now_playing(self):
        if _USE_ID3_TAG and self.meta:
            book = self.meta.get("album") or self.current_uid or ""
            artist = self.meta.get("artist") or ""
            chapter = self.meta.get("title") or (self.track_files[self.track_index] if self.track_files else "")
        else:
            book = self.current_uid or ""
            artist = ""
            chapter = self.track_files[self.track_index] if self.track_files else ""
        
        try:
            self.display.show_play(book, chapter, artist, self.play_state)
        except Exception:
            pass
    
    def _start_play(self, resume=True):
        f = self._current_file()
        if not f:
            return
        
        if _DEBUG: print("[CTRL] start playback:", f, "resume=", resume)
        
        # lazy ID3: erst später laden (wenn Audio schon läuft)
        if _USE_ID3_TAG:
            self.meta = {"title": "", "album": "", "artist": "", "track": ""}
            self._id3_pending_path = f
            self._id3_pending_set_ms = utime.ticks_ms()
        self._display_now_playing()
        
        self.offset = self.offset if resume else 0
        
        # Audio Start thread-safe
        self._audio_lock_acquire()
        try:
            self.audio.start(f, self.offset)
        finally:
            self._audio_lock_release()
        
        self.play_state = "PLAY"
        
        # set intial volume
        try:
            v = int(self.volume.read_percent()) if self.volume else 60
            if v < 0: v = 0
            if v > 100: v = 100
            self.volume.last = v
            self.audio.set_volume(v)
            getattr(self.display, "show_volume", lambda *_: None)(v)
        except Exception:
            pass

        self._display_now_playing()
    
    def _stop_play(self):
        if self.play_state in ("PLAY", "PAUSE"):
            self._audio_lock_acquire()
            try:
                self.audio.stop()
            except Exception:
                pass
            finally:
                self._audio_lock_release()
            
            self._save_progress()
        self.play_state = "IDLE"
        self._display_idle()
    
    def _pause_toggle(self):
        if self.play_state == "PLAY":
            self._audio_lock_acquire()
            try:
                self.audio.pause()
            except Exception:
                pass
            finally:
                self._audio_lock_release()
            self.play_state = "PAUSE"
            self._save_progress()

        elif self.play_state == "PAUSE":
            self._audio_lock_acquire()
            try:
                self.audio.resume()
            except Exception:
                pass
            finally:
                self._audio_lock_release()
            self.play_state = "PLAY"
        
        self._display_now_playing()
    
    def _next_chapter(self):
        if not self.track_files:
            return
        if _DEBUG: print("[CTRL] next chapter")
        self._stop_play()
        self.track_index = min(len(self.track_files) - 1, self.track_index + 1)
        self.offset = 0
        self._start_play(resume=False)
    
    def _prev_chapter(self):
        if not self.track_files:
            return
        if _DEBUG: print("[CTRL] prev chapter")
        self._stop_play()
        self.track_index = max(0, self.track_index - 1)
        self.offset = 0
        self._start_play(resume=False)
    
    def _feed_audio_and_update_progress(self):
        alive = self.audio.feed()
        if not alive:
            total = getattr(self.audio, "total_bytes", 0) or 0
            pos   = getattr(self.audio, "pos_bytes", 0) or 0
            
            # Wenn wir die Länge kennen und noch NICHT am Ende sind, dann war's kein EOF
            if total > 0 and pos < (total - 1024):
                # nur ein kurzer "nicht alive"-Moment -> weiter versuchen, nicht stoppen
                return
            
            # end of file -> next chapter or stop
            self.track_index += 1
            self.offset = 0
            if self.track_index >= len(self.track_files):
                self._save_progress()
                self._handle_stop()
                return
            # WICHTIG: neuen Track-Stand sofort persistieren,
            # damit ein Neustart nicht am alten Track hängen bleibt
            self._save_progress()
            self._start_play(resume=False)
            return
        
        # track offset from audio driver if available
        try:
            self.offset = int(getattr(self.audio, "pos_bytes", self.offset) or self.offset)
        except Exception:
            pass
        
        # update progress text not too frequently
        now_ms = utime.ticks_ms()
        if utime.ticks_diff(now_ms, self._last_progress_ms) < 250:
            return
        self._last_progress_ms = now_ms
        
        total = getattr(self.audio, "total_bytes", 0) or 0
        pos = getattr(self.audio, "pos_bytes", 0) or 0
        if total > 0:
            pct = int((pos * 100) // total)
            if pct != self._last_progress_pct:
                self._last_progress_pct = pct
                getattr(self.display, "set_progress_text", lambda *_: None)("{}%".format(pct))
    
    def _audio_lock_acquire(self):
        if self._audio_lock:
            self._audio_lock.acquire()
    
    def _audio_lock_release(self):
        if self._audio_lock:
            try:
                self._audio_lock.release()
            except Exception:
                pass
    
    def feed_audio_only(self):
        """
        Für Core1: nur VS1053 füttern. KEIN Display, KEINE Trigger.
        """
        if self.play_state != "PLAY":
            return
        self._audio_lock_acquire()
        try:
            self.audio.feed()
        except Exception:
            pass
        finally:
            self._audio_lock_release()
    
    def _update_progress_only(self):
        """
        Für Core0: Fortschritt aus audio.pos_bytes/total_bytes lesen und Display aktualisieren.
        """
        # total/pos nur lesen (kein feed!)
        try:
            total = int(getattr(self.audio, "total_bytes", 0) or 0)
            pos = int(getattr(self.audio, "pos_bytes", 0) or 0)
        except Exception:
            return
        
        if total > 0:
            pct = int((pos * 100) // total)
            if pct < 0: pct = 0
            if pct > 100: pct = 100
            getattr(self.display, "set_progress_text", lambda *_: None)("{:3d}%".format(pct))
        
        # offset für persistenz “mitziehen”
        try:
            self.offset = int(getattr(self.audio, "pos_bytes", self.offset) or self.offset)
        except Exception:
            pass
    
    def _maybe_load_id3_lazy(self):
        """
        Lädt ID3 erst, wenn Audio schon läuft (vermeidet Start-Lag/Block).
        """
        if not _USE_ID3_TAG:
            return
        if not self._id3_pending_path:
            return
        if self.play_state != "PLAY":
            return
        
        # heuristik: erst nach etwas “Pufferzeit”
        try:
            now_ms = utime.ticks_ms()
            if utime.ticks_diff(now_ms, self._id3_pending_set_ms) < 300:
                return
        except Exception:
            pass
        
                # 1) metadata.json schneller Weg
        try:
            album_dir = self.album_dir or ""
            meta_path = album_dir.rstrip("/") + "/metadata.json"
            with open(meta_path, "r") as f:
                m = json.load(f)
            # key z.B. track filename
            k = p.split("/")[-1]
            if k in m:
                self.meta = m[k]
                self._display_now_playing()
                return
        except Exception:
            pass
        
        p = self._id3_pending_path
        self._id3_pending_path = None
        
        try:
            self.meta = id3.read_id3(p)
        except Exception:
            self.meta = {"title": "", "album": "", "artist": "", "track": ""}
        
        self._display_now_playing()
    
    # ----------------------------
    # Volume + RTC
    # ----------------------------
    def _apply_volume_if_changed(self):
        if not self.volume:
            return
        
        try:
            changed, pct = self.volume.changed()
        except Exception:
            return
        
        if not changed:
            return
        
        now = utime.ticks_ms()
        if utime.ticks_diff(now, self._last_vol_set_ms) < 120:
            return
        self._last_vol_set_ms = now
        
        # clamp
        try:
            pct = int(pct)
        except Exception:
            return
        if pct < 0: pct = 0
        if pct > 100: pct = 100
        
        # Entprellen: kleine Zuckungen ignorieren
        if self._last_vol_pct is not None and abs(pct - self._last_vol_pct) < 2:
            return
        
        self._last_vol_pct = int(pct)
        try:
            self.audio.set_volume(int(pct))
        except Exception:
            pass
        
        # Dein OLED-UI hat show_volume(), nicht set_volume()
        getattr(self.display, "show_volume", lambda *_: None)(int(pct))
    
    def _update_clock(self, force=False):
        try:
            now_s = utime.time()
        except Exception:
            now_s = 0
        
        if not force and now_s == self._last_clock_s:
            return
        self._last_clock_s = now_s
        
        try:
            y, m, d, wd, hh, mm, ss = self.rtc.now()
        except Exception:
            return
        
        getattr(self.display, "set_time", lambda *_: None)("{:02d}:{:02d}".format(hh, mm))
        getattr(self.display, "set_date", lambda *_: None)("{:02d}.{:02d}.{:04d}".format(d, m, y))

