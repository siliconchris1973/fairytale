# rtc/__init__.py
from config import RTC_IMPL

def make_rtc():
    """
    Gibt eine RTC-Instanz zurück.
    Unterstützt aktuell:
      - "ds3231"   (DS3231 über I2C-Backpack)
      - "mock"     (Simulierte RTC über interne Uhrzeit des PiCo)
    """
    impl = (RTC_IMPL or "").lower()
    if impl == "ds3231":
        from .ds3231 import DS3231
        return DS3231()
    elif impl in ("mock", "fake", "none", "off", "null", ""):
        from .mock_rtc import MockRTC;  return MockRTC()
    else:
        raise ValueError("Unbekanntes RTC-Backend: {}".format(RTC_IMPL))
