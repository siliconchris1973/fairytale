from machine import Pin, SPI
import time

# Pins anpassen, falls bei dir anders
PIN_SCK  = 18
PIN_MOSI = 19
PIN_MISO = 16
PIN_CS   = 17

spi = SPI(0, baudrate=400_000, polarity=0, phase=0, bits=8,
          sck=Pin(PIN_SCK), mosi=Pin(PIN_MOSI), miso=Pin(PIN_MISO))
cs  = Pin(PIN_CS, Pin.OUT, value=1)

def cs_lo(): cs.value(0)
def cs_hi(): cs.value(1)

def rd_status():
    cs_lo()
    spi.write(b'\x02')          # Status lesen
    b = spi.read(1)[0]
    cs_hi()
    return b                    # 0x01 = ready, 0x00 = busy, 0xFF = nix/float

def wake_spi():
    # PN532 wecken: CS low und mind. 2 ms Nullen schieben
    cs_lo()
    spi.write(b'\x00' * 32)
    cs_hi()
    time.sleep_ms(5)

def write_frame(cmd):
    # Host->PN532 via SPI (0x01 Präfix)
    length = len(cmd)
    lcs = (-length) & 0xFF
    dcs = (-(sum(cmd) & 0xFF)) & 0xFF
    frame = bytearray([0x01, 0x00, 0x00, 0xFF, length, lcs]) + cmd + bytearray([dcs, 0x00])
    cs_lo()
    spi.write(frame)
    cs_hi()

def read_frame(timeout_ms=1000):
    t0 = time.ticks_ms()
    # auf ready warten
    while time.ticks_diff(time.ticks_ms(), t0) < timeout_ms:
        if rd_status() == 0x01:
            break
        time.sleep_ms(5)
    else:
        return None
    cs_lo()
    spi.write(b'\x03')              # Read
    pre = spi.read(5)               # 00 00 FF LEN LCS
    if len(pre) < 5 or pre[2] != 0xFF:
        cs_hi(); return None
    ln = pre[3]
    _ = spi.read(1)                 # dummy
    data = spi.read(ln + 2)         # payload + DCS
    _ = spi.read(1)                 # post 00
    cs_hi()
    return data

print("PN532 SPI Diagnose")
wake_spi()

# Roh-Status beobachten
vals = [rd_status() for _ in range(5)]
print("Status-Bytes:", [hex(v) for v in vals])

# Versuch: GetFirmwareVersion (D4 02)
write_frame(bytearray([0xD4, 0x02]))
resp = read_frame(1500)
print("Antwort:", resp)

if resp:
    tfi, cmd = resp[0], resp[1]
    if tfi == 0xD5 and cmd == 0x03:
        ic, ver, rev, support = resp[2], resp[3], resp[4], resp[5]
        print("Firmware OK:", "IC=0x%02X Ver=%d.%d Support=0x%02X" % (ic, ver, rev, support))
    else:
        print("Frame empfangen, aber Inhalt passt nicht:", [hex(x) for x in resp])
else:
    print("Keine gültige Antwort. Prüfe CS, DIP (SPI), SVDD=3V3, Verkabelung.")
