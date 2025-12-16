# audio/__init__.py
from config import AUDIO_IMPL

def make_audio():
    """
    Gibt eine Audio-Instanz mit der einheitlichen BaseAudio-API zurück.
    Unterstützt aktuell:
      - "vs1053"   (VS1053 über I2C-Backpack)
      - "mock"     (Simuliertes Audio ohne Hardware)
    """
    impl = (AUDIO_IMPL or "").lower()
    if impl == "vs1053":
        from .vs1053 import VS1053
        return VS1053()
    elif impl in ("mock", "fake", "none", "off", "null", ""):
        from .mock_audio import MockAudio
        return MockAudio()
    else:
        raise ValueError("Unbekanntes Audio-Backend: {}".format(AUDIO_IMPL))
