# display/__init__.py
from config import (
                    DISPLAY_IMPL,
                    i2c
                    )

def make_display():
    """
    Gibt eine Display-Instanz mit der einheitlichen BaseDisplay-API zurück.
    Unterstützt aktuell:
      - "sh1106"   (SH1106 Oled 128x64 über I2C)
      - "mock"     (Simuliertes Display ohne Hardware)
    """
    impl = (DISPLAY_IMPL or "").lower()
    if impl == "sh1106":
        from .sh1106_oled import SH1106
        return SH1106(i2c)
    elif impl in ("mock", "fake", "none", "off", "null", ""):
        from .mock_display import MockDisplay
        return MockDisplay()
    else:
        raise ValueError("Unbekanntes Display-Backend: {}".format(DISPLAY_IMPL))
