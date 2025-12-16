# rc522_scan_strong.py — stabileres Scannen (gain/ask/antenne/timeout)
from machine import Pin, SPI
import time

PIN_SCK, PIN_MOSI, PIN_MISO = 18, 19, 16
PIN_CS,  PIN_RST            = 17, 21

spi = SPI(0, baudrate=2_000_000, polarity=0, phase=0, bits=8,
          sck=Pin(PIN_SCK), mosi=Pin(PIN_MOSI), miso=Pin(PIN_MISO))
cs  = Pin(PIN_CS,  Pin.OUT, value=1)
rst = Pin(PIN_RST, Pin.OUT, value=1)

# Register
CommandReg, ComIEnReg, DivIEnReg, ComIrqReg = 0x01, 0x02, 0x03, 0x04
ErrorReg, Status2Reg, FIFODataReg, FIFOLevelReg = 0x06, 0x08, 0x09, 0x0A
ControlReg, BitFramingReg, ModeReg, TxControlReg = 0x0C, 0x0D, 0x11, 0x14
TxASKReg, RFCfgReg = 0x15, 0x26
TModeReg, TPrescalerReg, TReloadRegH, TReloadRegL = 0x2A, 0x2B, 0x2C, 0x2D
VersionReg = 0x37

PCD_Idle, PCD_CalcCRC, PCD_Transceive, PCD_SoftReset = 0x00, 0x03, 0x0C, 0x0F
PICC_REQIDL, PICC_ANTICOLL = 0x26, 0x93

def _sel():   cs.value(0)
def _unsel(): cs.value(1)

def _wreg(a, v):
    _sel(); spi.write(bytearray([ (a<<1) & 0x7E ])); spi.write(bytearray([v])); _unsel()

def _rreg(a):
    _sel(); spi.write(bytearray([ 0x80 | ((a<<1) & 0x7E) ])); v = spi.read(1)[0]; _unsel(); return v

def _set(a,m): _wreg(a, _rreg(a) | m)
def _clr(a,m): _wreg(a, _rreg(a) & ~m)

def antenna_on():
    if (_rreg(TxControlReg) & 0x03) != 0x03:
        _set(TxControlReg, 0x03)

def reset_init():
    _wreg(CommandReg, PCD_SoftReset)
    time.sleep_ms(50)
    # Timer & Mode wie bewährt
    _wreg(TModeReg,      0x8D)
    _wreg(TPrescalerReg, 0x3E)
    _wreg(TReloadRegH,   30)
    _wreg(TReloadRegL,   0)
    _wreg(ModeReg,       0x3D)   # CRC preset 0x6363
    _wreg(TxASKReg,      0x40)   # 100% ASK erzwingen (ISO14443A)
    _wreg(RFCfgReg,      0x70)   # Max RX Gain
    antenna_off(); antenna_on()

def antenna_off():
    _clr(TxControlReg, 0x03)

def _to_card(cmd, send, timeout_ms=200):
    _wreg(ComIrqReg, 0x7F)        # IRQs löschen
    _wreg(FIFOLevelReg, 0x80)     # FIFO flush
    for b in send: _wreg(FIFODataReg, b)
    _wreg(CommandReg, cmd)
    if cmd == PCD_Transceive: _set(BitFramingReg, 0x80)  # StartSend

    t0 = time.ticks_ms()
    while time.ticks_diff(time.ticks_ms(), t0) < timeout_ms:
        irq = _rreg(ComIrqReg)
        if irq & 0x30: break      # RxIRq oder IdleIRq
        time.sleep_ms(2)
    _clr(BitFramingReg, 0x80)

    if _rreg(ErrorReg) & 0x1B: return None
    n = _rreg(FIFOLevelReg)
    return [ _rreg(FIFODataReg) for _ in range(n) ]

def reqa():
    _wreg(BitFramingReg, 0x07)  # nur 7 Bits
    r = _to_card(PCD_Transceive, [PICC_REQIDL])
    _wreg(BitFramingReg, 0x00)
    return r  # ATQA (2 Bytes) erwartet

def anticollision():
    _wreg(BitFramingReg, 0x00)
    r = _to_card(PCD_Transceive, [PICC_ANTICOLL, 0x20])
    if not r or len(r) < 5: return None
    uid = r[:5]
    if uid[4] != (uid[0]^uid[1]^uid[2]^uid[3]): return None
    return bytes(uid[:4])

while True:
    print("RC522 Scan (gain/ask/antenne)")
    reset_init()
    ver = _rreg(VersionReg)
    print("VersionReg:", hex(ver), "TxControl:", hex(_rreg(TxControlReg)), "RFCfg:", hex(_rreg(RFCfgReg)))
    
    found = False
    print("Halte ein 13.56 MHz ISO14443A-Tag (MIFARE/NTAG) mittig vor die Antenne (~1–3 cm).")
    
    for _ in range(50):
        if reqa():
            uid = anticollision()
            if uid:
                print("✅ Tag-UID:", uid.hex().upper())
                found = True
                break
        time.sleep_ms(150)

    if not found:
        print("⚠️  Kein Tag erkannt. Prüfe Tag-Typ (muss 13.56 MHz, ISO14443A), Abstand, Metall unter dem Board, 3.3 V-Versorgung.")
    print("wart mal 3 sekunden")
    time.sleep(3)
