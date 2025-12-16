# clock_demo.py — DS3231 (0x68) auslesen und Zeit auf SH1106 (0x3C) anzeigen
from machine import I2C, Pin
from libs.sh1106 import SH1106_I2C
import time

# I2C1 auf GP2/GP3
i2c = I2C(1, sda=Pin(2), scl=Pin(3), freq=100_000)
print("I2C1:", [hex(a) for a in i2c.scan()])  # sollte ['0x3c','0x50','0x68'] zeigen

# --- DS3231 Helfer ---
ADDR_RTC = 0x68
def bcd2dec(b): return (b >> 4) * 10 + (b & 0x0F)

def read_time():
    raw = i2c.readfrom_mem(ADDR_RTC, 0x00, 7)  # sec min hour dow day month year
    ss = bcd2dec(raw[0] & 0x7F)
    mm = bcd2dec(raw[1] & 0x7F)
    hh = bcd2dec(raw[2] & 0x3F)  # 24h
    dd = bcd2dec(raw[4] & 0x3F)
    mo = bcd2dec(raw[5] & 0x1F)
    yr = 2000 + bcd2dec(raw[6])
    return yr, mo, dd, hh, mm, ss

# --- Display ---
oled = SH1106_I2C(128, 64, i2c, addr=0x3C)  # falls 128x32: Höhe=32 verwenden
oled.fill(0); oled.text("RTC + OLED OK", 0, 0); oled.show()
time.sleep_ms(500)

# Laufanzeige
while True:
    try:
        y, m, d, h, mi, s = read_time()
        oled.fill(0)
        oled.text("DS3231 @0x68", 0, 0)
        oled.text(f"{y:04d}-{m:02d}-{d:02d}", 0, 16)
        oled.text(f"{h:02d}:{mi:02d}:{s:02d}", 0, 32)
        oled.show()
        time.sleep_ms(250)
    except OSError:
        # Bus hiccup: minimal robust
        time.sleep_ms(50)
