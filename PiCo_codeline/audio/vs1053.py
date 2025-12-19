# audio/vs1053.py

from audio.base import BaseAudio
from machine import Pin
from config import (
    , audio_spi as spi
    , VS1053_CS_PIN
    , VS1053_DCS_PIN
    , VS1053_DREQ_PIN
    , VS1053_RST_PIN
    , _STREAM_CHUNK
    , _MAX_FEED_CHUNKS
    , _MAX_FEED_MS
    , SPI_AUDIO_LOCK as SPI_LOCK
    _DEBUG_AUDIO as _DEBUG
)
import utime, os

# VS1053 SCI Register
SCI_MODE   = 0x00
SCI_STATUS = 0x01
SCI_BASS   = 0x02
SCI_CLOCKF = 0x03
SCI_VOL    = 0x0B


class VS1053(BaseAudio):
    """
    VS1053 Treiber + einfacher File-Streamer.

    Public API (kompatibel zum Controller):
      - init()
      - start(filepath, offset_bytes=0)
      - feed()
      - pause(), resume()
      - stop() -> returns last offset
      - set_volume(percent)
      - properties: pos_bytes, total_bytes, is_playing
    """

    def __init__(self):
        # Chip-Selects und DREQ
        self.xcs  = Pin(VS1053_CS_PIN,  Pin.OUT, value=1)  # Control-CS
        self.xdcs = Pin(VS1053_DCS_PIN, Pin.OUT, value=1)  # Data-CS
        self.dreq = Pin(VS1053_DREQ_PIN, Pin.IN)

        # Optionaler HW-Reset
        if VS1053_RST_PIN >= 0:
            self.reset = Pin(VS1053_RST_PIN, Pin.OUT, value=1)
        else:
            self.reset = None

        self._f = None
        self._offset = 0
        self._paused = False

        # ---- NEU: Status/Progress für Controller ----
        self._total_bytes = 0
        self.is_playing = False

    # ---- NEU: Properties, die dein Controller erwartet ----
    @property
    def pos_bytes(self):
        return self._offset

    @property
    def total_bytes(self):
        return self._total_bytes

    # --- Low-Level SPI-Access ---
    def _wait_dreq(self, timeout_ms=200, loop_sleep_ms=1):
        start = utime.ticks_ms()
        while not self.dreq.value():
            if utime.ticks_diff(utime.ticks_ms(), start) > timeout_ms:
                if _DEBUG:
                    print("[VS1053] WARN: DREQ timeout (>{} ms)".format(timeout_ms))
                return False
            utime.sleep_ms(loop_sleep_ms)
        return True

    def _write_cmd(self, addr, value):
        # SCI write: 0x02, addr, high, low
        if not self._wait_dreq(200, 1):
            return 0
        SPI_LOCK.acquire()
        try:
            self.xcs.value(0)
            spi.write(bytes([0x02, addr, (value >> 8) & 0xFF, value & 0xFF]))
            self.xcs.value(1)
        finally:
            SPI_LOCK.release()
    
    def _read_cmd(self, addr):
        # SCI read: 0x03, addr, read 2 bytes
        if not self._wait_dreq(200, 1):
            return 0
        SPI_LOCK.acquire()
        try:
            self.xcs.value(0)
            spi.write(bytes([0x03, addr]))
            d = spi.read(2)
            self.xcs.value(1)
        finally:
            SPI_LOCK.release()
        return (d[0] << 8) | d[1]
    
    def _write_data(self, b):
        mv = memoryview(b)
        length = len(mv)
        idx = 0
        
        SPI_LOCK.acquire()
        try:
            self.xdcs.value(0)
            try:
                while idx < length:
                    if not self._wait_dreq(200, 1):
                        return
                    n = min(32, length - idx)
                    spi.write(mv[idx:idx + n])
                    idx += n
            finally:
                self.xdcs.value(1)
        finally:
            SPI_LOCK.release()
    
    def _soft_reset(self):
        # Setze SM_RESET-Bit in SCI_MODE für Soft-Reset
        self._write_cmd(SCI_MODE, 0x0800)
        utime.sleep_ms(2)
        start = utime.ticks_ms()
        while not self.dreq.value():
            if utime.ticks_diff(utime.ticks_ms(), start) > 1000:
                if _DEBUG:
                    print("[VS1053] ERROR: DREQ did not go high within 1s after reset")
                break
            utime.sleep_ms(1)

    # --- Public API ---
    def init(self):
        if _DEBUG:
            print("[VS1053] init: start")

        # HW-Reset nur, wenn Pin vorhanden
        if self.reset is not None:
            self.reset.value(0)
            utime.sleep_ms(5)
            self.reset.value(1)
            utime.sleep_ms(5)

        # Soft-Reset und Grundsetup
        self._soft_reset()
        if _DEBUG:
            print("[VS1053] init: after reset, DREQ =", self.dreq.value())

        # internen Clock-Multiplikator erhöhen
        self._write_cmd(SCI_CLOCKF, 0x9800)  # ~3.0x
        self.set_volume(60)
        if _DEBUG:
            print("[VS1053] init: basic MODE set")

    def set_volume(self, percent: int):
        # VS1053 Volume: 0x00 = max, 0xFEFE = mute.
        pct = max(0, min(100, percent))
        att = int((100 - pct) / 100 * 0xFE)
        val = (att << 8) | att
        self._write_cmd(SCI_VOL, val)

    def start(self, filepath: str, offset: int = 0):
        # ---- NEU: total_bytes setzen ----
        try:
            st = os.stat(filepath)
            self._total_bytes = st[6] if len(st) > 6 else 0
        except Exception:
            self._total_bytes = 0

        if self._f:
            self.stop()

        self._f = open(filepath, "rb")
        if offset:
            try:
                self._f.seek(offset)
                self._offset = offset
            except Exception:
                self._offset = 0
        else:
            self._offset = 0

        self._paused = False
        self.is_playing = True  # ---- NEU ----

    def feed(self):
        """
        Füttert den VS1053 mit mehreren Chunks pro Aufruf, um den internen FIFO
        maximal zu füllen, ohne den Mainloop zu lange zu blockieren.
        
        Rückgabe:
        - False, wenn der Track zu Ende ist
        - True, solange noch Daten vorhanden sind
        """
        if self._paused or not self._f:
            # pausiert: wenn Datei offen -> weiterhin "alive"
            return False if not self._f else True
        
        start_ms = utime.ticks_ms()
        chunks_sent = 0
        
        while chunks_sent < _MAX_FEED_CHUNKS:
            if utime.ticks_diff(utime.ticks_ms(), start_ms) > _MAX_FEED_MS:
                break
            
            chunk = self._f.read(_STREAM_CHUNK)
            if not chunk:
                # Datei zu Ende
                self.stop()
                return False
            
            self._write_data(chunk)
            self._offset += len(chunk)
            chunks_sent += 1
            
            if len(chunk) < _STREAM_CHUNK:
                break
        
        return True
    
    def pause(self):
        self._paused = True
    
    def resume(self):
        self._paused = False
    
    def stop(self) -> int:
        off = self._offset
        if self._f:
            try:
                self._f.close()
            except Exception:
                pass
        self._f = None
        self._offset = 0
        self._paused = False
        
        # ---- NEU: Status reset ----
        self._total_bytes = 0
        self.is_playing = False
        
        return off
