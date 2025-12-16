# nfc_i2c_test.py  —  PN532 I2C Quick Test für Raspberry Pi Pico (MicroPython)
# Ablauf: I2C-Scan -> Ready/Status -> Firmware -> SAMConfiguration -> Tag-Scan

from machine import I2C, Pin
import time

# ---------- Pins und I2C-Setup ----------
I2C_ID  = 1
PIN_SCL = 3
PIN_SDA = 2
i2c = I2C(I2C_ID, scl=Pin(PIN_SCL), sda=Pin(PIN_SDA), freq=100_000)

# Gängige PN532 I2C-Adressen (7-bit)
CANDIDATES = [0x24, 0x48, 0x7B]

def find_addr():
    found = i2c.scan()
    for a in CANDIDATES:
        if a in found:
            return a
    return found[0] if found else None

ADDR = find_addr()

def info(*args): print(*args)

if ADDR is None:
    print("PN532 I2C: kein Gerät gefunden. Scan:", [hex(a) for a in i2c.scan()])
    raise SystemExit

print("PN532 I2C-Adresse:", hex(ADDR))

# ---------- Frame-Helfer (I2C) ----------
# I2C-Protokoll: Frame = 00 00 FF LEN LCS [PAYLOAD] DCS 00
# PAYLOAD beginnt mit TFI=0xD4 (Host->PN532) bzw. 0xD5 (Antwort)
def write_frame(payload: bytes):
    ln = len(payload)
    lcs = (-ln) & 0xFF
    dcs = (-(sum(payload) & 0xFF)) & 0xFF
    # Bei I2C wird vor dem PN532-Frame meist zwei 0x00 als "I2C Header" gesendet
    frame = bytes([0x00, 0x00, 0xFF, ln, lcs]) + payload + bytes([dcs, 0x00])
    # Viele Boards erwarten zusätzlich ein anfängliches 0x00 vor dem Frame:
    # "I2C-Prefix" = 0x00 0x00 + Frame -> Zahlreiche Implementierungen senden 0x00 0x00 + Frame
    # Praktisch funktioniert beides je nach Clone. Wir senden konservativ 0x00 0x00 + Frame.
    i2c.writeto(ADDR, b'\x00\x00' + frame)

def read_status(timeout_ms=0):
    # Status-Byte an Reg 0x00: 0x01=Ready, 0x00=Busy; manche Clones lesen Direkt-Read
    if timeout_ms <= 0:
        try:
            return i2c.readfrom_mem(ADDR, 0x00, 1)[0]
        except:
            # Fallback: Direkt-Read, wenn readfrom_mem nicht unterstützt wird
            try:
                return i2c.readfrom(ADDR, 1)[0]
            except:
                return 0xFF
    t0 = time.ticks_ms()
    while time.ticks_diff(time.ticks_ms(), t0) < timeout_ms:
        s = read_status(0)
        if s in (0x00, 0x01):
            return s
        time.sleep_ms(5)
    return 0xFF

def wait_ready(timeout_ms=1000):
    t0 = time.ticks_ms()
    while time.ticks_diff(time.ticks_ms(), t0) < timeout_ms:
        s = read_status(0)
        if s == 0x01:
            return True
        time.sleep_ms(5)
    return False

def read_frame(max_len=255):
    # Vollständigen Antwort-Frame lesen
    # Manche Clones liefern bei readfrom_mem(0x00, n) stabilere Ergebnisse; probieren wir Direkt-Read konservativ.
    # Erst Header+Länge holen: 00 00 FF LEN LCS
    hdr = i2c.readfrom(ADDR, 6)  # oft 1-2 "leading" Bytes inkl. Status; wir holen 6, prüfen ab Position 2
    # Suche nach 0xFF-Marker
    idx = -1
    for i in range(len(hdr)-3):
        if hdr[i] == 0x00 and hdr[i+1] == 0x00 and hdr[i+2] == 0xFF:
            idx = i
            break
    if idx < 0:
        # Notfalls erneut lesen (einige Clones brauchen zwei Zyklen)
        hdr = i2c.readfrom(ADDR, 6)
        for i in range(len(hdr)-3):
            if hdr[i] == 0x00 and hdr[i+1] == 0x00 and hdr[i+2] == 0xFF:
                idx = i
                break
        if idx < 0:
            return None
    ln = hdr[idx+3]
    # Dummy/Turnaround-Byte und Payload(+DCS) + Post-0x00
    # Wir lesen großzügig: ln + 3 (DCS+00+evtl. Füllbyte)
    body = i2c.readfrom(ADDR, ln + 3)
    # Erwartet: [payload (ln bytes)] [DCS] [0x00]
    payload = body[0:ln+1]  # inkl. DCS am Ende
    # Post-Byte bleibt im Puffer oft übrig; für einfachen Test reichen Payload-Bytes.
    return payload

# ---------- High-Level Kommandos ----------
def get_firmware():
    # Command 0x02 — GetFirmwareVersion; Payload beginnt mit 0xD4
    if not wait_ready(1000):
        return None
    write_frame(bytes([0xD4, 0x02]))
    if not wait_ready(1000):
        return None
    resp = read_frame()
    if not resp or len(resp) < 7:
        return None
    # resp enthält: [TFI=0xD5][CMD=0x03][IC][Ver][Rev][Support] [DCS]
    tfi, cmd = resp[0], resp[1]
    if tfi == 0xD5 and cmd == 0x03:
        ic, ver, rev, support = resp[2], resp[3], resp[4], resp[5]
        return (ic, ver, rev, support)
    return None

def sam_configuration():
    # Command 0x14 — SAMConfiguration, normal mode, timeout 50ms*20=1s, IRQ enable
    # 0xD4 0x14 0x01 0x14 0x01
    if not wait_ready(1000):
        return False
    write_frame(bytes([0xD4, 0x14, 0x01, 0x14, 0x01]))
    if not wait_ready(1000):
        return False
    resp = read_frame()
    return bool(resp and len(resp) >= 2 and resp[0] == 0xD5 and resp[1] == 0x15)

def in_list_passive_target_106A():
    # Command 0x4A — InListPassiveTarget (106 kbps Type A), max 1 target
    # 0xD4 0x4A 0x01 0x00
    if not wait_ready(1000):
        return None
    write_frame(bytes([0xD4, 0x4A, 0x01, 0x00]))
    if not wait_ready(1200):
        return None
    resp = read_frame()
    if not resp or len(resp) < 4:
        return None
    # Erwartet: D5 4B NbTg=1 Tg=01 LenUID UID...
    if resp[0] == 0xD5 and resp[1] == 0x4B and resp[2] >= 1:
        # Einfaches UID-Parsen:
        # resp = [D5][4B][NbTg][Tg][BrTy][... viele Felder ...][LenUID][UID...][DCS]
        data = bytes(resp)  # einfacher
        # Heuristik: die letzten Bytes vor DCS enthalten UID, aber Länge variiert (4,7,10)
        # Wir suchen das Byte, das plausibel die UID-Länge ist (4/7/10) und danach genug Bytes vorhanden sind.
        for i in range(5, len(data)-1):
            ln = data[i]
            if ln in (4,7,10) and i+1+ln <= len(data)-1:
                uid = data[i+1:i+1+ln]
                return uid
    return None

# ---------- Start ----------
print("PN532 I2C Quick Test")
# Status-Probe (5x)
stats = []
for _ in range(5):
    stats.append(read_status(0))
    time.sleep_ms(5)
print("Status-Bytes:", [hex(s) for s in stats])  # 0x01 = ready, 0x00 = busy

fw = get_firmware()
if fw:
    ic, ver, rev, sup = fw
    print("Firmware:", "IC=0x%02X" % ic, "Ver=%d.%d" % (ver, rev), "Support=0x%02X" % sup)
else:
    print("❌ Keine Firmware-Antwort. Prüfe SVDD=3V3, I2C-Wiring, Adresswahl, Modus (SET0=L, SET1=H).")
    raise SystemExit

ok = sam_configuration()
print("SAMConfiguration:", "OK" if ok else "FAIL")

print("Halte jetzt eine MIFARE-Karte an das Board ...")
time.sleep_ms(500)
uid = in_list_passive_target_106A()
if uid:
    print("✅ Tag gefunden. UID:", uid.hex().upper())
else:
    print("⚠️  Kein Tag/keine Antwort. Versuch es nochmal und halte die Karte näher/langsamer.")
