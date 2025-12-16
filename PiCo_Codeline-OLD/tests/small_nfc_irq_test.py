from machine import Pin
from config import PN532_IRQ_PIN
import utime

irq = Pin(PN532_IRQ_PIN, Pin.IN, Pin.PULL_UP)

print("Halte Tag hin / weg und beobachte Werte:")
for _ in range(50):
    print("IRQ:", irq.value())
    utime.sleep_ms(200)
