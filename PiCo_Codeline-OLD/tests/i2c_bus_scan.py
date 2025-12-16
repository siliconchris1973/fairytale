# i2c_bruteforce_scan.py  (auf dem Pico ausführen)
from machine import I2C, Pin
import utime

candidates = [
    # (bus, sda, scl)
    (0, 0, 1),   # GP0/GP1  -> I2C0 default
    (1, 2, 3),   # GP2/GP3  -> I2C1 default
    (0, 4, 5),   # GP4/GP5  -> alternative
    (1, 6, 7),   # GP6/GP7
    (0, 8, 9),
    (1, 10, 11),
    (0, 12, 13),
    (1, 14, 15),
    (0, 16, 17),
    (1, 18, 19),
    (0, 20, 21),
    (1, 26, 27), # Achtung: ADC an 26-28; nur falls wirklich so verdrahtet
]

def scan_one(bus, sda, scl):
    try:
        i2c = I2C(bus, sda=Pin(sda), scl=Pin(scl), freq=100000)
        utime.sleep_ms(20)
        found = i2c.scan()
        print("I2C{} @ SDA GP{:02d} / SCL GP{:02d} -> {}".format(
            bus, sda, scl, [hex(a) for a in found]))
        return found
    except Exception as e:
        print("I2C{} @ SDA GP{:02d} / SCL GP{:02d} -> ERROR: {}".format(bus, sda, scl, e))
        return []

any_found = False
for bus, sda, scl in candidates:
    found = scan_one(bus, sda, scl)
    if found:
        any_found = True

if not any_found:
    print(">>> Kein Device auf den getesteten Pins/Bussen gefunden.")
    print(">>> Dann stimmt entweder die Verdrahtung gar nicht, es ist kein Geraet versorgt,")
    print(">>> oder die benutzten Pins in deinem Aufbau sind andere als in dieser Liste.")
