# volume.py
# Unterstützt zwei Modi:
# - VOLUME="poti": echter ADC am POTI_ADC_PIN (z. B. GP26/ADC0)
# - VOLUME="buttons": 2 buttons einer lauter, einer leiser (z. B. GP26 und GP27)
# - VOLUME="mock": simulierte Lautstärkeänderung (Dreieckswelle 0..100)
from config import (
                    VOLUME_IMPL,
                    VOLUME_MIN_RAW,
                    VOLUME_MAX_RAW,
                    VOLUME_GAMMA,
                    _DEBUG_VOL as _DEBUG
                )

if VOLUME_IMPL == "poti":
    from config import POTI_ADC_PIN
    try:
        from config import VOLUME_INVERT
    except Exception:
        VOLUME_INVERT = False
    try:
        from machine import ADC, Pin
    except Exception:
        ADC = None
        Pin = None
elif VOLUME_IMPL in ("buttons", "btn", "key"):
    try:
        from config import BTN_VUP, BTN_VDN
    except Exception:
        BTN_VUP = None
        BTN_VDN = None
    try:
        from machine import Pin
    except Exception:
        Pin = None
elif VOLUME_IMPL in ("mock", "fake", "none", "off", "null", ""):
    if _DEBUG: print("Mock Volume implementation")
else:
    raise ValueError("Unbekanntes Volume Control: {}".format(VOLUME_IMPL))

import utime


class _BaseVolume:
    def __init__(self):
        self.last = None  # letzter zurückgegebener Prozentwert (0..100)
    
    def read_percent(self):
        raise NotImplementedError
    
    def changed(self, threshold=2):
        """Gibt (changed_flag, percent) zurück."""
        p = int(self.read_percent())
        if self.last is None or abs(p - self.last) >= int(threshold):
            self.last = p
            return True, p
        return False, self.last


class _PotiVolume(_BaseVolume):
    """Echter Poti am ADC. Erwartet 3-Pin-Poti: GND — Wiper — 3V3 (oder umgekehrt)."""
    def __init__(self, pin):
        super().__init__()
        if ADC is None:
            raise RuntimeError("ADC not available")
        self.adc = ADC(pin)
        
        # Filter & Timing
        self._ema = None
        self._alpha = 0.12
        self._min_interval_ms = 50
        
        self._samples = 8
        self._q_step = 2
        self._hyst = 2
        self._reported = None
        
        self._last_read_ms = 0
        self._invert = bool(VOLUME_INVERT)
    
    def _read_raw_once(self):
        v = self.adc.read_u16()  # 0..65535
        if v < 0: v = 0
        if v > 65535: v = 65535
        return v
    
    def _read_raw_avg(self):
        acc = 0
        n = self._samples if self._samples > 1 else 1
        for _ in range(n):
            acc += self._read_raw_once()
        return acc // n
    
    def read_percent(self):
        now = utime.ticks_ms()
        if self._last_read_ms and utime.ticks_diff(now, self._last_read_ms) < self._min_interval_ms:
            if self._ema is not None and self._reported is not None:
                return self._reported
        self._last_read_ms = now
        
        raw = self._read_raw_avg()
        if self._ema is None:
            self._ema = raw
        else:
            self._ema = int(self._alpha * raw + (1 - self._alpha) * self._ema)
        
        # --- Kalibrierung: MIN/MAX anwenden (damit 0..100 erreichbar ist) ---
        mn = int(VOLUME_MIN_RAW) if VOLUME_MIN_RAW is not None else 0
        mx = int(VOLUME_MAX_RAW) if VOLUME_MAX_RAW is not None else 65535
        if mx <= mn:
            mn, mx = 0, 65535  # Fallback
        
        v = int(self._ema)
        if v < mn: v = mn
        if v > mx: v = mx
        
        pct = int(((v - mn) * 100) / (mx - mn))
        # --- Snap to endpoints to kill ADC jitter near extremes ---
        if pct <= 2:
            pct = 0
        elif pct >= 98:
            pct = 100

        # --- optional invert (nur hier!) ---
        if self._invert:
            pct = 100 - pct
        
        # --- Gamma-Kurve: oben sanfter, weniger "explodieren" ---
        try:
            g = float(VOLUME_GAMMA)
        except Exception:
            g = 1.0
        if g and g != 1.0:
            x = pct / 100.0
            pct = int((x ** g) * 100)
            if pct < 0: pct = 0
            if pct > 100: pct = 100
        
        if self._q_step > 1:
            pct = (pct // self._q_step) * self._q_step
        
        if self._reported is None:
            self._reported = pct
        else:
            if abs(pct - self._reported) >= self._hyst:
                self._reported = pct
        
        return int(self._reported)


class _MockVolume(_BaseVolume):
    """Simuliert eine Lautstärkebewegung (Dreieck 0..100). Nützlich ohne Hardware."""
    def __init__(self):
        super().__init__()
        self._dir = 1
        self._val = 0
        self._last_step = 0
        self._step_ms = 120
        self._step = 2
    
    def read_percent(self):
        now = utime.ticks_ms()
        if not self._last_step or utime.ticks_diff(now, self._last_step) >= self._step_ms:
            self._last_step = now
            self._val += self._dir * self._step
            if self._val >= 100:
                self._val = 100
                self._dir = -1
            elif self._val <= 0:
                self._val = 0
                self._dir = 1
        return int(self._val)


class _ButtonsVolume(_BaseVolume):
    """
    Lautstärke über zwei Buttons:
      - BTN_VUP  (active low, PullUp)   → lauter
      - BTN_VDN  (active low, PullUp)   → leiser
    
    Features:
      - Debounce auf Flanke
      - Auto-Repeat bei gehaltenem Button
      - Long-Press-Beschleunigung
      - Clipping 0..100
    """
    def __init__(self, pin_up, pin_dn):
        super().__init__()
        if Pin is None:
            raise RuntimeError("Pin not available")
        
        self._pin_up = Pin(pin_up, Pin.IN, Pin.PULL_UP)
        self._pin_dn = Pin(pin_dn, Pin.IN, Pin.PULL_UP)
        
        # interner Zustand
        self._pct = 50  # Startwert (kannst du anpassen)
        self.last = self._pct
        
        # Debounce/Repeat/Acceleration Parameter
        self._debounce_ms = 40
        self._repeat_delay_ms = 300   # Wartezeit bis Auto-Repeat startet
        self._repeat_rate_ms  = 120   # Wiederholrate
        self._accel_after_ms  = 800   # ab hier größere Steps
        self._step_small = 2
        self._step_large = 6
        
        # Zustände pro Taste
        self._st = {
            "up":  {"last": 1, "pressed_at": 0, "last_rep": 0},
            "dn":  {"last": 1, "pressed_at": 0, "last_rep": 0},
        }
        self._last_sample_ms = 0
    
    def _sample(self, name, pin):
        now = utime.ticks_ms()
        # Einfaches Sampling-Limit (optional)
        if self._last_sample_ms and utime.ticks_diff(now, self._last_sample_ms) < self._debounce_ms:
            return
        self._last_sample_ms = now
        
        v = pin.value()  # 0 = gedrückt (active low)
        s = self._st[name]
        last = s["last"]
        
        # Flanke: falling → einmaliger Step
        if v == 0 and last == 1:
            s["pressed_at"] = now
            s["last_rep"] = now
            self._bump(name, first=True)
        
        # gehalten → Auto-Repeat
        if v == 0 and last == 0:
            held_ms = utime.ticks_diff(now, s["pressed_at"])
            if utime.ticks_diff(now, s["last_rep"]) >= (self._repeat_delay_ms if held_ms < self._repeat_delay_ms else self._repeat_rate_ms):
                s["last_rep"] = now
                self._bump(name, first=False, held_ms=held_ms)
        
        # rising → Taste losgelassen
        if v == 1 and last == 0:
            s["pressed_at"] = 0
            s["last_rep"] = 0
        
        s["last"] = v
    
    def _bump(self, name, first=False, held_ms=0):
        # Step-Größe
        step = self._step_small
        if held_ms >= self._accel_after_ms:
            step = self._step_large
        
        if name == "up":
            self._pct += step
        else:
            self._pct -= step
        
        if self._pct < 0:   self._pct = 0
        if self._pct > 100: self._pct = 100
    
    def read_percent(self):
        # beide Tasten sampeln
        self._sample("up", self._pin_up)
        self._sample("dn", self._pin_dn)
        return int(self._pct)


# öffentliche Factory
class Volume(_BaseVolume):
    def __init__(self):
        super().__init__()
        self.last = None
        mode = (VOLUME_IMPL or "poti").lower()
        
        if mode == "poti":
            self._impl = _PotiVolume(POTI_ADC_PIN)
        elif mode in ("buttons", "btn", "key", "keys"):
            if BTN_VUP is None or BTN_VDN is None:
                # Fallback, damit es nicht crasht, wenn Pins fehlen
                self._impl = _MockVolume()
            else:
                self._impl = _ButtonsVolume(BTN_VUP, BTN_VDN)
        elif mode in ("mock", "fake", "none", "off", "null", ""):
            self._impl = _MockVolume()
        else:
            self._impl = _MockVolume()
    
    def read_percent(self):
        return self._impl.read_percent()
    
    def changed(self, threshold=2):
        changed, p = self._impl.changed(threshold)
        self.last = getattr(self._impl, "last", p)
        return changed, p
