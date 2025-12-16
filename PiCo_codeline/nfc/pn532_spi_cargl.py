# nfc/pn532_spi_cargl.py
from machine import SPI, Pin
from nfc.base import BaseNFC
import libs.NFC_PN532 as nfc  # erwartet libs/NFC_PN532.py
import utime
from config import _DEBUG_NFC as _DEBUG

class NFC_PN532_SPI(BaseNFC):
    """
    Wrapper um libs.NFC_PN532.PN532 für den Einsatz am Raspberry Pi Pico.
    
    - Initialisiert den PN532 über SPI.
    - read_uid() macht den "schweren" PN532-Call (nur im Idle benutzen!).
    - is_tag_still_present() nutzt spezielle Funktionen im NFC Treiber, die
      keine vollständige Abfrage machen und sehr kurze timeouts haben, damit
      der Audio feed nicht blockiert, während wir auf Tag Präsenz prüfen.
    """
    
    def __init__(self, spi_id, sck, mosi, miso, cs_pin, irq_pin=None, baud=1_000_000):
        self.spi_id = spi_id
        self.sck = sck
        self.mosi = mosi
        self.miso = miso
        self.cs_pin = cs_pin
        self.irq_pin = irq_pin
        self.baud = baud
        
        self.spi = None
        self.cs = None
        self.nfc_dev = None
        self.ready = False
        
        self.last_present = False
        if not self.irq_pin == None:
            self.irq = Pin(self.irq_pin, Pin.IN, Pin.PULL_UP)
        else:
            self.irq = None
            
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
        self.nfc_dev = nfc.PN532(self.spi, self.cs, self.irq)
        # kleine Startpause hilft manchen PN532-Boards
        utime.sleep_ms(30)
        ic, ver, rev, sup = self.nfc_dev.get_firmware_version()
        if _DEBUG:
            print(
                "[NFC] Board Info: FW {}.{} (ic=0x{:02X}, sup=0x{:02X}) @{} Hz".format(
                    ver, rev, ic, sup, baud
                )
            )
        self.nfc_dev.SAM_configuration()
        return True
    
    def init(self) -> bool:
        """Initialisiert den PN532 mit der gewünschten oder einer konservativen Baudrate."""
        # Versuch 1: eingestellte Baudrate
        try:
            if self._try_init_once(self.baud):
                self.ready = True
                return True
        except Exception as e:
            if _DEBUG: print("[NFC] init@{} failed:".format(self.baud), e)
        
        # Versuch 2: konservativere Baudrate 250 kHz
        try:
            utime.sleep_ms(50)
            if self._try_init_once(250_000):
                self.ready = True
                return True
        except Exception as e:
            if _DEBUG: print("[NFC] init@250k failed:", e)
        
        # gescheitert
        self.ready = False
        self.nfc_dev = None
        return False
    
    # ---------------------------------------------------------------------
    # UID lesen (nur im Idle benutzen!)
    # ---------------------------------------------------------------------
    def read_uid(self, timeout_ms=1000):
        """
        Liest die UID eines aufgelegten Tags.
        
        WICHTIG:
        - Diese Methode fasst IMMER die PN532-Library an und kann blockieren.
        - Deshalb nur im Idle (wenn NICHT abgespielt wird) mit langem Timeout aufrufen.
          Bei Playback mnur mit ganz kurzem Timeout, so dass der Audiostream nicht abreisst
        """
        if not self.ready or not self.nfc_dev:
            if _DEBUG: print("[NFC] NFC Board not ready / configured - exiting")
            return None
        
        if _DEBUG:
            start = 0
            dur = 0
            start = utime.ticks_ms()
        
        try:
            # libs.NFC_PN532 erwartet hier Millisekunden als Timeout
            uid = self.nfc_dev.read_passive_target(timeout=timeout_ms)
        except RuntimeError as e:
            # typischer Fehler: ACK nicht erhalten → wir loggen und tun so, als wäre kein Tag da
            if _DEBUG:
                dur = utime.ticks_diff(utime.ticks_ms(), start)
                print("[NFC] read_uid RuntimeError after " +str(dur)+ "ms: ", e)
            return None
        except Exception as e:
            # falls der Treiber noch etwas anderes wirft
            if _DEBUG:
                dur = utime.ticks_diff(utime.ticks_ms(), start)
                print("[NFC] read_uid unexpected error after " +str(dur)+ "ms: ", e)
            return None
        
        if _DEBUG:
            dur = utime.ticks_diff(utime.ticks_ms(), start)
            print("[NFC] read_uid took " +str(dur)+ "ms for timeout ", timeout_ms)
        
        if not uid:
            if _DEBUG: print("[NFC] No uid returned from Board")
            return None
        
        uid_hex = bytes(uid).hex().upper()
        if _DEBUG: print("[NFC] found UID", uid_hex)
        return uid_hex
    
    def is_tag_still_present(self, timeout_ms=40):
        """
        Schneller Präsenz-Check:
        - Nutzt PN532.check_passive_target_fast().
        - Semantik:
          * True  -> Tag sicher vorhanden
          * False -> PN532 sagt sicher: kein Tag
          * None  -> keine Info (nicht bereit / Timeout)
        """
        if not self.ready or not self.nfc_dev:
            # NFC kaputt => Audio nicht stoppen
            return True
        
        try:
            present = self.nfc_dev.read_uid(timeout_ms)
        except Exception as e:
            if _DEBUG: print("[NFC] is_tag_still_present fast-check error:", e)
            return True  # konservativ
        
        if present is None:
            # keine Information, PN532 war nicht schnell genug -> NICHT als "Tag weg" werten
            if _DEBUG: print("[NFC] fast-check inconclusive -> assume still present")
            return True
        
        return present
