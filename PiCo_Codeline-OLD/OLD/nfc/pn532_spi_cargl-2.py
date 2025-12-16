# nfc/pn532_spi_cargl.py
from machine import SPI, Pin
from nfc.base import BaseNFC
import libs.NFC_PN532 as nfc  # erwartet libs/NFC_PN532.py
import utime


class NFC_PN532_SPI(BaseNFC):
    """
    Wrapper um libs.NFC_PN532.PN532 für den Einsatz am Raspberry Pi Pico.

    - Initialisiert den PN532 über SPI.
    - read_uid() macht den "schweren" PN532-Call (nur im Idle benutzen!).
    - is_tag_still_present() nutzt bevorzugt NUR den IRQ-Pin, um während der
      Wiedergabe zu prüfen, ob der Tag noch da ist, ohne die PN532-Lib zu belasten.
    """
    
    def __init__(self, spi_id, sck, mosi, miso, cs_pin, baud=1_000_000, irq_pin=None, _DEBUG=False):
        self.spi_id = spi_id
        self.sck = sck
        self.mosi = mosi
        self.miso = miso
        self.cs_pin = cs_pin
        self.baud = baud
        
        self.spi = None
        self.cs = None
        self.dev = None
        self.ready = False
        self._DEBUG = _DEBUG
        
        # Optionaler IRQ-Pin (typisch: aktiv LOW, 0 = Event/Tag, 1 = idle)
        self.irq_pin_no = irq_pin
        self.irq = Pin(irq_pin, Pin.IN, Pin.PULL_UP) if irq_pin is not None else None
        
        # State für Presence-Checks
        self._last_presence_check = 0
        self._missing_since = None
    
    # ---------------------------------------------------------------------
    # Initialisierung
    # ---------------------------------------------------------------------
    def _try_init_once(self, baud) -> bool:
        # CS und SPI initialisieren
        self.cs = Pin(self.cs_pin, Pin.OUT)
        self.cs.value(1)
        self.spi = SPI(
            self.spi_id,
            baudrate=baud,
            polarity=0,
            phase=0,
            sck=Pin(self.sck),
            mosi=Pin(self.mosi),
            miso=Pin(self.miso),
        )
        # PN532-Objekt erzeugen
        self.dev = nfc.PN532(self.spi, self.cs)
        # kleine Startpause hilft manchen PN532-Boards
        utime.sleep_ms(30)
        ic, ver, rev, sup = self.dev.get_firmware_version()
        if self._DEBUG == True:
            print(
                "[NFC] FW {}.{} (ic=0x{:02X}, sup=0x{:02X}) @{} Hz".format(
                    ver, rev, ic, sup, baud
                )
            )
        self.dev.SAM_configuration()
        return True

    def init(self) -> bool:
        """Initialisiert den PN532 mit der gewünschten oder einer konservativen Baudrate."""
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

    # ---------------------------------------------------------------------
    # Präsenzabfrage während der Wiedergabe
    # ---------------------------------------------------------------------
    def is_tag_still_present(self, uid_hex: str,
                             check_interval_ms=1000,
                             lost_after_ms=1500) -> bool:
        """
        Prüfe sparsam, ob das gegebene UID-Tag noch da ist.
        
        - Es wird nur alle `check_interval_ms` ms wirklich der PN532 abgefragt.
        - Nur wenn wir länger als `lost_after_ms` durchgehend KEIN passendes UID sehen,
          melden wir False (Tag "verloren").
        - Fehler und kurze Funklöcher werden ignoriert.
        """
        
        # Wenn PN532 nicht bereit ist → nicht dauernd stoppen
        if not self.ready or self.dev is None:
            return True
        
        now = utime.ticks_ms()
        
        # Noch zu früh für den nächsten Check → optimistisch True
        if utime.ticks_diff(now, self._last_presence_check) < check_interval_ms:
            return True
        
        self._last_presence_check = now
        
        try:
            # Sehr kurzer Timeout, damit Audio nicht leidet
            uid = self.dev.read_passive_target(timeout=5)  # 5 ms!
        except Exception as e:
            if self._DEBUG:
                print("[NFC][presence] error:", e)
            return True  # Fehler nicht als "Tag weg" deuten
        
        if uid:
            seen_uid = bytes(uid).hex().upper()
            if self._DEBUG:
                print("[NFC][presence] seen", seen_uid, "expected", uid_hex)
            if seen_uid == uid_hex:
                # Tag wie erwartet gesehen -> "missing"-Timer zurücksetzen
                self._missing_since = None
                return True
        
        # Hier: kein UID oder falsches UID
        if self._missing_since is None:
            # Erster "Fehlt"-Befund -> Timer starten, aber noch nicht stoppen
            self._missing_since = now
            return True
        
        # Schon länger "weg"? -> jetzt wirklich als verloren werten
        if utime.ticks_diff(now, self._missing_since) > lost_after_ms:
            if self._DEBUG:
                print("[NFC] tag", uid_hex, "assumed LOST")
            self._missing_since = None
            return False
        
        # Noch innerhalb der Wartezeit -> weiter optimistisch
        return True
    
    # ---------------------------------------------------------------------
    # UID lesen (nur im Idle benutzen!)
    # ---------------------------------------------------------------------
    def read_uid(self, timeout_ms=300):
        """
        Liest die UID eines aufgelegten Tags.

        WICHTIG:
        - Diese Methode fasst IMMER die PN532-Library an und kann blockieren.
        - Deshalb nur im Idle (wenn NICHT abgespielt wird) aufrufen.
        - Während der Wiedergabe stattdessen is_tag_still_present() verwenden.
        """
        if not self.ready or not self.dev:
            return None

        try:
            # libs.NFC_PN532 erwartet hier Millisekunden als Timeout
            uid = self.dev.read_passive_target(timeout=timeout_ms)
        except RuntimeError as e:
            # typischer Fehler: ACK nicht erhalten → wir loggen und tun so, als wäre kein Tag da
            print("[NFC] read_uid RuntimeError:", e)
            return None
        except Exception as e:
            # falls der Treiber noch etwas anderes wirft
            print("[NFC] read_uid unexpected error:", e)
            return None

        if not uid:
            return None

        uid_hex = bytes(uid).hex().upper()
        if self._DEBUG == True:
            print("[NFC] found UID", uid_hex)
        return uid_hex
