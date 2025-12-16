from storage import mount_sd
from audio.vs1053 import VS1053
import utime

# SD mounten (ggf. richtigen Mountpoint einsetzen)
mount_sd("/")

# VS1053 initialisieren
audio = VS1053()
audio.init()

# Lautstärke MAX zum Test
audio.set_volume(100)    # aktuell: 100 → 0x0000

# Ein Testfile wählen – z.B. /sd/test/001.mp3
FILEPATH = "/sd/043BE222E74C81/track001.mp3"

audio.start(FILEPATH, offset=0)

while True:
    alive = audio.feed()
    if not alive:
        break
    # ganz kurzer Sleep, damit der Loop nicht komplett spinnt
    utime.sleep_ms(1)
