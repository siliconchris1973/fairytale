# nfc/pn532_spi_cargl.py
from machine import SPI, Pin
import sys
from nfc.base import BaseNFC
import libs.NFC_PN532 as nfc  # erwartet libs/NFC_PN532.py
import utime

class NFC_PN532_SPI(BaseNFC):
    def __init__(self, spi_id, sck, mosi, miso, cs_pin, irq_pin=None, baud=1_000_000, _DEBUG=False):
        self.spi_id = spi_id
        self.sck = sck
        self.mosi = mosi
        self.miso = miso
        self.cs_pin = cs_pin
        self.irq_pin_no = irq_pin
        self.baud = baud
        self.spi = None
        self.cs = None
        self.dev = None
        self.ready = False   # <<<<<< wichtig
        self._DEBUG = _DEBUG
        
        # Optionaler IRQ-Pin (aktiv LOW angenommen)
        if irq_pin is not None:
            self.irq = Pin(irq_pin, Pin.IN, Pin.PULL_UP)
        else:
            self.irq = None
    
    def _try_init_once(self, baud) -> bool:
        self.cs = Pin(self.cs_pin, Pin.OUT); self.cs.on()
        self.spi = SPI(self.spi_id, baudrate=baud, polarity=0, phase=0,
                       sck=Pin(self.sck), mosi=Pin(self.mosi), miso=Pin(self.miso))
        self.dev = nfc.PN532(self.spi, self.cs)
        # kleine Startpause hilft manchen PN532-Boards
        utime.sleep_ms(30)
        ic, ver, rev, sup = self.dev.get_firmware_version()
        if self._DEBUG == True:
            print("[NFC] PN532 FW {}.{} (ic=0x{:02X}, sup=0x{:02X}) @{} Hz".format(ver, rev, ic, sup, baud))
        self.dev.SAM_configuration()
        return True
    
    def init(self) -> bool:
        # Versuch 1: eingestellte Baudrate
        try:
            if self._try_init_once(self.baud):
                self.ready = True
                return True
        except Exception as e:
            print("[NFC] init@{} failed:".format(self.baud), e)
        
        # Versuch 2: konservativere Baudrate 250 kHz
        try:
            utime.sleep_ms(50)
            if self._try_init_once(250_000):
                self.ready = True
                return True
        except Exception as e:
            print("[NFC] init@250k failed:", e)
        
        # gescheitert
        self.ready = False
        self.dev = None
        return False
    
    def is_tag_present_irq(self) -> bool:
        """Günstiger Check über die IRQ-Leitung.
        
        Gibt True zurück, wenn die IRQ-Leitung anzeigt, dass der PN532
        „etwas zu melden“ hat (typischerweise: Tag im Feld / neues Event).
        
        Fallback: Wenn kein IRQ konfiguriert ist, immer True (dann entscheidet
        der Aufrufer selbst, ob er read_uid() aufruft).
        """
        if self.irq is None:
            # Kein IRQ -> aus Sicht des Aufrufers „ja, nachsehen“
            return True
        
        if self._DEBUG == True:
            print("[NFC] checking for tag: " + str(self.irq.value()))
        # Annahme: aktiv LOW, 0 = Event/Karte, 1 = idle
        return self.irq.value() == 0
    
    def is_tag_still_present(self) -> bool:
        """Wird vom Player während des Playbacks benutzt.
        
        - Wenn IRQ konfiguriert ist, nutzen wir ausschließlich den IRQ-Pin.
        - Falls kein IRQ: kleiner Fallback-Check mit sehr kurzem Timeout.
        """
        if self.irq is not None:
            # Annahme: 0 = Karte/Ereignis, 1 = kein Tag
            return self.irq.value() == 0
        
        # Fallback ohne IRQ: sehr kurzer PN532-Call (möglichst selten aufrufen!)
        uid = self.read_uid(timeout_ms=20)
        return uid is not None
    
    def read_uid(self, timeout_ms=300):
        """Liest die UID eines aufgelegten Tags.
        
        - Wenn ein IRQ-Pin konfiguriert ist und „kein Event“ signalisiert,
          kehren wir sofort mit None zurück.
        - Andernfalls rufen wir die PN532-Library mit einem begrenzten Timeout auf.
        """
        if not self.ready or not self.dev:
            return None
        
        # Wenn IRQ vorhanden ist und 'idle' meldet, gar nicht erst den
        # schweren PN532-Call ausführen.
        if self.irq is not None and self.irq.value() == 1:
            return None
        
        # Viele PN532-Libs erwarten Sekunden als Timeout
        timeout_s = timeout_ms / 1000.0
        
        try:
            uid = self.dev.read_passive_target(timeout=timeout_s)
        except RuntimeError as e:
            print("[NFC] read_uid RuntimeError:", e)
            return None
        except Exception as e:
            print("[NFC] read_uid unexpected error:", e)
            return None
        
        if not uid:
            return None
        
        return bytes(uid).hex().upper()
