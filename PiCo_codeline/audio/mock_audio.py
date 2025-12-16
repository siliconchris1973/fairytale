# audio/null_audio.py
from audio.base import BaseAudio
import utime
from config import _DEBUG_AUDIO as _DEBUG

class MockAudio(BaseAudio):
    """
    Simuliert MP3-Playback:
      - feste Trackdauer (standard 10 s)
      - 'feed()' treibt Fortschritt mit avg_bps voran
      - am Ende -> stop() und Rückgabe False, damit Controller Kapitel weiter schaltet
      - stellt pos_bytes / total_bytes für die Fortschrittsanzeige bereit
    """
    def __init__(self, track_seconds=10, avg_bps=16_000):
        # avg_bps = "Bytes pro Sekunde" simuliert; 16 kB/s ~ "gemütlich"
        self.track_seconds = int(track_seconds)
        self.avg_bps = int(avg_bps)
        self._playing = False
        self._paused  = False
        self._last_ms = 0
        self._filename= None
        
        # Fortschritt in Bytes (für Prozentanzeige)
        self.total_bytes = self.avg_bps * self.track_seconds
        self.pos_bytes   = 0
    
    # --- Pflicht-API ---
    def init(self):
        if _DEBUG: print("[AUDIO] Mock Audio init ({} s/Track, {} B/s)".format(self.track_seconds, self.avg_bps))
    
    def set_volume(self, percent:int):
       if _DEBUG: print("[AUDIO] volume:", percent, "%")
    
    def start(self, filepath:str, offset:int=0):
        self._filename = filepath
        # Tracklänge pro Start neu berechnen (falls pro Kapitel variieren soll)
        self.total_bytes = self.avg_bps * self.track_seconds
        self._playing = True
        self._paused  = False
        self.pos_bytes = max(0, int(offset))
        self._last_ms = utime.ticks_ms()
        if _DEBUG: print("[AUDIO] start:", filepath, "offset", self.pos_bytes, "(len ~{}B ≈ {}s)".format(self.total_bytes, self.track_seconds))
    
    def feed(self) -> bool:
        if not self._playing or self._paused:
            return self._playing
        
        now = utime.ticks_ms()
        dt_ms = utime.ticks_diff(now, self._last_ms)
        if dt_ms <= 0:
            return True
        self._last_ms = now
        
        # einfacher Fortschritt mit minimaler Jitter-Simulierung
        advance = int(self.avg_bps * dt_ms / 1000)
        if advance <= 0:
            advance = 1
        prev_bytes = self.pos_bytes
        self.pos_bytes += advance
        
        # Herzschlag einmal pro Sekunde
        if (self.pos_bytes // self.avg_bps) != (prev_bytes // self.avg_bps):
            sec = self.pos_bytes // self.avg_bps
            if _DEBUG: print("[AUDIO] playing {}s / ~{}s".format(sec, self.track_seconds))
        
        if self.pos_bytes >= self.total_bytes:
            self.pos_bytes = self.total_bytes
            if _DEBUG: print("[AUDIO] end of track:", self._filename)
            self.stop()   # setzt playing False, pausiert, pos_bytes bleibt auf total_bytes
            return False
        return True
    
    def pause(self):
        if self._playing and not self._paused:
            self._paused = True
            if _DEBUG: print("[AUDIO] pause at", self.pos_bytes)
    
    def resume(self):
        if self._playing and self._paused:
            self._paused = False
            self._last_ms = utime.ticks_ms()
            if _DEBUG: print("[AUDIO] resume")
    
    def stop(self) -> int:
        off = self.pos_bytes
        self._playing = False
        self._paused  = False
        self.pos_bytes = 0
        if _DEBUG: print("[AUDIO] stop at", off)
        return off
