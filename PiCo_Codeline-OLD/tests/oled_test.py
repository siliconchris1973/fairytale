from machine import I2C, Pin
from libs.ssd1306 import SSD1306_I2C
import time

# --- wähle deinen Bus hier ---
BUS = 1          # 0 für GP0/GP1, 1 für GP2/GP3
SDA = 0 if BUS==0 else 2
SCL = 1 if BUS==0 else 3

i2c = I2C(BUS, sda=Pin(SDA), scl=Pin(SCL), freq=400_000)
print("I2C scan:", [hex(a) for a in i2c.scan()])   # erwartete Adresse: 0x3C (manchmal 0x3D)

addr = 0x3C if (0x3C in i2c.scan()) else 0x3D
oled = SSD1306_I2C(128, 64, i2c, addr=addr)

oled.fill(0)
oled.text("Hello, Chris!", 0, 0)
oled.text("I2C{} @ {:02x}".format(BUS, addr), 0, 10)
oled.rect(0, 20, 128, 12, 1)
oled.text("SSD1306 OK", 16, 22)
oled.show()
