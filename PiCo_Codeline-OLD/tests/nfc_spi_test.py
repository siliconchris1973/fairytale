# PN532 SPI Quick Test (MicroPython, Raspberry Pi Pico)
from machine import Pin, SPI
import time

# --- Pinout (anpassen, falls nötig)
PIN_SCK  = 18
PIN_MOSI = 19
PIN_MISO = 16
PIN_CS   = 17
PIN_RST  = 21   # optional, aber hilfreich
PIN_IRQ  = 20   # optional

# --- SPI + Pins
spi = SPI(0, baudrate=1_000_000, polarity=0, phase=0, bits=8,
          sck=Pin(PIN_SCK), mosi=Pin(PIN_MOSI), miso=Pin(PIN_MISO))
cs  = Pin(PIN_CS, Pin.OUT, value=1)
rst = Pin(PIN_RST, Pin.OUT, value=1)
try:
    irq = Pin(PIN_IRQ, Pin.IN)
except:
    irq = None

def cs_low():  cs.value(0)
def cs_high(): cs.value(1)

# --- Hilfsfunktionen nach PN532-SPI-Protokoll
HOST_TO_PN532 = 0x01
PN532_TO_HOST = 0x02

def hw_reset():
    # Low-Puls reicht meist
    rst.value(0); time.sleep_ms(20)
    rst.value(1); time.sleep_ms(400)   # PN532 bootet

def read_status():
    # Eine Status-Byte-Abfrage: 0x00 = busy, 0x01 = ready
    cs_low()
    spi.write(bytearray([0x02]))   # Leseheader
    status = spi.read(1)[0]
    cs_high()
    return status

def wait_ready(timeout_ms=1000):
    t0 = time.ticks_ms()
    while time.ticks_diff(time.ticks_ms(), t0) < timeout_ms:
        if read_status() == 0x01:
            return True
        time.sleep_ms(5)
    return False

def write_frame(cmd_bytes):
    # cmd_bytes: beginnt mit TFI=0xD4, dann Command + Data
    length = len(cmd_bytes)
    lcs = (0x100 - length) & 0xFF
    dcs = (0x100 - (sum(cmd_bytes) & 0xFF)) & 0xFF
    frame = bytearray([HOST_TO_PN532, 0x00, 0x00, 0xFF, length, lcs]) + cmd_bytes + bytearray([dcs, 0x00])
    cs_low()
    spi.write(frame)
    cs_high()

def read_frame(maxlen=255):
    # Erwartet Antwort-Frame vom PN532
    cs_low()
    spi.write(bytearray([0x03]))          # Leseheader
    pre = spi.read(5)                      # 0x00 0x00 0xFF LEN LCS
    if pre[2] != 0xFF:
        cs_high(); return None, b''
    length = pre[3]
    _ = spi.read(1)                        # Dummy (Timing/Turnaround)
    data = spi.read(length + 2)            # Daten(+DCS)
    post = spi.read(1)                     # 0x00
    cs_high()
    return length, data

def get_firmware():
    # Command 0x02 (GetFirmwareVersion), TFI=0xD4
    if not wait_ready(1000):
        return None
    write_frame(bytearray([0xD4, 0x02]))
    if not wait_ready(1000):
        return None
    _len, payload = read_frame()
    if not payload or _len is None:
        return None
    # Antwort beginnt mit TFI=0xD5, CMD=0x03, dann IC, Ver, Rev, Support
    try:
        tfi, cmd, ic, ver, rev, support = payload[0], payload[1], payload[2], payload[3], payload[4], payload[5]
        if tfi == 0xD5 and cmd == 0x03:
            return ic, ver, rev, support
    except:
        pass
    return None

# --- Start
print("PN532 SPI Quick Test")
hw_reset()
ok = wait_ready(1500)
print("Ready:", ok)

fw = get_firmware()
if fw:
    ic, ver, rev, support = fw
    print("Firmware:", "IC=0x%02X" % ic, "Ver=%d.%d" % (ver, rev), "Support=0x%02X" % support)
    print("✅ Verkabelung/Modus OK. Als nächstes: SAMConfiguration & Tag-Scan.")
else:
    print("❌ Keine Antwort. Prüfe: Versorgung (VDD5V), SVDD=3V3, CS/IRQ/Reset, DIP-Schalter (SPI), GND.")
