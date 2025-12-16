# /nfc/__init__.py

from config import NFC_IMPL, _DEBUG_NFC as _DEBUG
from machine import Pin

def make_nfc():
    """
    Gibt eine NFC-Reader-Instanz mit der einheitlichen BaseNFC-API zurück.
    Unterstützt aktuell:
      - "pn532_i2c"  (PN532 über SPI mit der CARGL Bibliothek)
      - "mock"       (Simulierter NFC-Leser mit zwei UIDs ohne Hardware)

    WICHTIG:
    - Diese Funktion ruft KEIN init() auf. Das macht main.setup().
    - Falls irgendwas schiefgeht (Import/Constructor), fällt sie auf MockNFC zurück,
      damit der Rest des Systems weiterläuft.
    """
    impl = (NFC_IMPL or "").lower()
    
    try:
        if impl == "pn532_spi":
            from config import NFC_SPI_ID, NFC_SPI_SCK, NFC_SPI_MOSI, NFC_SPI_MISO, NFC_SPI_CS, NFC_IRQ_PIN, NFC_SPI_BAUD
            from .pn532_spi_cargl import NFC_PN532_SPI
            nfc_impl = NFC_PN532_SPI(
                spi_id=NFC_SPI_ID
                , sck=NFC_SPI_SCK
                , mosi=NFC_SPI_MOSI
                , miso=NFC_SPI_MISO
                , cs_pin=NFC_SPI_CS
                , irq_pin=NFC_IRQ_PIN   # <-- wichtig
                , baud=NFC_SPI_BAUD  # zum Start 1 MHz; bei Bedarf 250 kHz testen
            )
            return nfc_impl
        else:
            # unbekannter Wert in NFC_IMPL -> fallback
            if _DEBUG: print("[NFC] unknown NFC_IMPL '{}', falling back to mock".format(NFC_IMPL))
            from .mock_nfc import MockNFC
            return MockNFC()
    except Exception as e:
        # falls irgendwas beim Import oder beim Erzeugen des echten Readers schiefgeht:
        if _DEBUG: print("[NFC] make_nfc fallback to mock due to error:", e)
        from .mock_nfc import MockNFC
        return MockNFC()
