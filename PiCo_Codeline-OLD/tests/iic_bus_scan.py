from machine import I2C, Pin
import time

def scan_bus(bus, sda, scl):
    try:
        i2c = I2C(bus, sda=Pin(sda), scl=Pin(scl), freq=100_000)
        time.sleep_ms(20)
        addrs = i2c.scan()
        print(f"I2C{bus} SDA=GP{sda} SCL=GP{scl} ->", [hex(a) for a in addrs])
    except Exception as e:
        print(f"I2C{bus} init error:", e)

# Pico Standard:
# I2C0: SDA=GP0, SCL=GP1
# I2C1: SDA=GP2, SCL=GP3
scan_bus(0, 0, 1)
scan_bus(1, 2, 3)
