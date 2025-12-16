from machine import I2C, Pin
import time

# internen Pull-Up an SCL/SDA einschalten (nur Test)
SDA_PIN = 0
SCL_PIN = 1
I2C_BUS = 0

SDA=Pin(SDA_PIN, Pin.OPEN_DRAIN, value=1)
SCL=Pin(SCL_PIN, Pin.OPEN_DRAIN, value=1)

# 9 Clock-Pulse mit SDA high
for _ in range(9):
    SCL.value(0); time.sleep_us(5)
    SCL.value(1); time.sleep_us(5)

# STOP Condition
SDA.value(0); time.sleep_us(5)
SCL.value(1); time.sleep_us(5)
SDA.value(1); time.sleep_us(5)

print("Recovery versuch fertig - check des busses.")

Pin(SDA_PIN, Pin.IN, Pin.PULL_UP)
Pin(SCL_PIN, Pin.IN, Pin.PULL_UP)

i2c = I2C(I2C_BUS, scl=Pin(SCL_PIN), sda=Pin(SDA_PIN), freq=100000)
time.sleep_ms(50)
print("Scan:", [hex(a) for a in i2c.scan()])

# Harte Probe auf typische PN532-Adressen
for a in (0x24, 0x48, 0x7B):
    try:
        i2c.writeto(a, b'\x00')
        print("Probe", hex(a), "ACK")
    except Exception as e:
        print("Probe", hex(a), "NACK", e)
