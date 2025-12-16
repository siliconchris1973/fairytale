from machine import I2C, Pin
import utime

I2C_ID = 1
I2C_SCL = 3   # GP3
I2C_SDA = 2   # GP2
I2C_FREQ = 100_000

# Pins anpassen, falls bei dir anders:
i2c = I2C(I2C_ID, scl=Pin(I2C_SCL), sda=Pin(I2C_SDA), freq=I2C_FREQ)

print("I2C scan:", [hex(a) for a in i2c.scan()])

ADDR = 0x24
def rd(n):
    try:
        b = i2c.readfrom(ADDR, n)
        print("read", n, "->", [hex(x) for x in b])
        return b
    except Exception as e:
        print("read fail:", e)

def wr(buf):
    try:
        i2c.writeto(ADDR, buf)
        print("write", len(buf), "ok")
        return True
    except Exception as e:
        print("write fail:", e)
        return False

# 1) Status-Byte testen (PN532 I2C liefert 0x01 = ready, 0x00 = busy)
for _ in range(5):
    rd(1); utime.sleep_ms(50)

# 2) Wakeup-Poke (ein einzelnes 0x00 schreiben ist üblich)
wr(b"\x00"); utime.sleep_ms(5)
rd(1)

# 3) Ein minimaler Frame (GetFirmware 0x02)
# Frame: 00 00 FF 02 FE D4 02 2A 00
frame = bytes([0x00,0x00,0xFF,0x02,0xFE,0xD4,0x02,0x2A,0x00])
wr(frame)
utime.sleep_ms(5)
# ACK sollte 7 Bytes inkl. Status liefern -> 01 00 00 FF 00 FF 00
rd(7)
# Danach Header lesen (z. B. 8 Bytes) – wenn's klappt, folgen wir mit Rest.
rd(8)
