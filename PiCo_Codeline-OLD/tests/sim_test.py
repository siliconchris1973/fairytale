# sim_test.py — robuste Simulation ohne Hardware (MicroPython geeignet)
import os, utime, sys

# ---- 0) Modulcache leeren, damit neue Config sicher greift ----
for m in ("display", "display.__init__", "nfc", "nfc.__init__", "audio", "audio.__init__", "rtc", "rtc.__init__"):
    if m in sys.modules:
        sys.modules.pop(m)

# ---- 1) Config: SIM-Modus aktivieren, bevor Factories geladen werden ----
import config
config.SIM_MODE     = True
config.DISPLAY_IMPL = "null"   # null / oled / lcd1602
config.NFC_IMPL     = "mock"   # mock / pn532 / mfrc522
config.AUDIO_IMPL   = "null"   # null / vs1053
config.RTC_IMPL     = "fake"   # fake / ds3231

STATE_DIR  = getattr(config, "STATE_DIR", "/app_state")
AUDIO_ROOT = getattr(config, "AUDIO_ROOT", "/")

print("[SIM] Config gesetzt:",
      "SIM_MODE=", config.SIM_MODE,
      "DISPLAY=", config.DISPLAY_IMPL,
      "NFC=", config.NFC_IMPL,
      "AUDIO=", config.AUDIO_IMPL,
      "RTC=", config.RTC_IMPL)

# ---- Hilfsfunktionen: mkdir rekursiv (ohne os.makedirs) ----
def ensure_dir(path: str):
    if not path or path == "/":
        return
    parts = [p for p in path.split("/") if p]
    cur = ""
    for p in parts:
        cur = cur + "/" + p
        try: os.mkdir(cur)
        except OSError: pass

def ensure_file(path: str, content=b""):
    ensure_dir("/".join(path.split("/")[:-1]) or "/")
    try:
        with open(path, "rb"):
            return
    except OSError:
        with open(path, "wb") as f:
            f.write(content)

# ---- 2) Testdaten: zwei UIDs mit Dummy-"MP3s" ----
TEST_UIDS = {"325465743": 3, "12345678": 2}
for uid, nfiles in TEST_UIDS.items():
    d = "{}/{}".format(AUDIO_ROOT.rstrip("/"), uid)
    ensure_dir(d)
    for i in range(1, nfiles + 1):
        ensure_file("{}/{:03d}.mp3".format(d, i), b"")  # leer reicht
ensure_dir(STATE_DIR)

# ---- 3) Simulation: Buttons & Prog-Schalter ----
class SimButtons:
    def __init__(self, t0):
        self.t0 = t0
        self._fired = set()
    def _due(self, s):
        now = utime.ticks_diff(utime.ticks_ms(), self.t0) // 1000
        key = "s{}".format(s)
        if now >= s and key not in self._fired:
            self._fired.add(key)
            return True
        return False
    def poll(self):
        ev = []
        if self._due(8):  ev.append("next")
        if self._due(12): ev.append("play_pause")   # pause
        if self._due(15): ev.append("play_pause")   # resume
        if self._due(20): ev.append("prev")
        if self._due(25): ev.append("stop")
        return ev

class SimProgSwitch:
    def value(self): return 1  # 1 = Normalmodus

# ---- 4) Factories/Module laden & initialisieren ----
from display import make_display
from nfc import make_nfc
from audio import make_audio
from rtc import make_rtc
from controller import PlayerController
from volume import Volume
from storage import mount_sd

display = make_display()
nfc = make_nfc()
audio = make_audio()
rtc = make_rtc()

# Mount (im SIM_MODE fällt storage auf "/" zurück)
mount_sd("/")

display.init()
display.show_status("SIM-Start", "Tag folgt...")

class QuietVolume(Volume):
    def changed(self, threshold=2):
        now = utime.ticks_ms() // 1000
        if now % 6 == 0:
            self.last = (self.last or 50)
            v = (self.last + 10) % 100
            self.last = v
            return True, v
        return False, (self.last or 60)

t0 = utime.ticks_ms()
buttons = SimButtons(t0)
prog_switch = SimProgSwitch()
vol = QuietVolume()

pc = PlayerController(display, nfc, audio, rtc, buttons, vol, prog_switch)

# ---- 5) Laufzeit: einfache Bedingung (ohne ticks_add) ----
RUN_MS = 30_000
print("[SIM] Laufzeit ~{}s".format(RUN_MS//1000))
display.show_status("SIM läuft", "30s Demo")

while utime.ticks_diff(utime.ticks_ms(), t0) < RUN_MS:
    pc.loop()
    utime.sleep_ms(5)

# ---- 6) Ergebnisse: States drucken ----
print("\n=== Persistente States ({}): ===".format(STATE_DIR))
for uid in TEST_UIDS.keys():
    p = "{}/{}.json".format(STATE_DIR, uid)
    try:
        with open(p, "r") as f:
            print(uid, "->", f.read())
    except OSError:
        print(uid, "-> (kein State geschrieben)")

print("\nSIM fertig.")
