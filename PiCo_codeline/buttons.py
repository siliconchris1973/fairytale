# buttons.py
from machine import Pin
import utime
from config import (
                    BUTTONS,
                    _DEBUG_BTN as _DEBUG
                    )

class Buttons:
    """
    Liest Button-Definitionen aus config.BUTTONS und bietet:
      - poll(): liefert gefeuert-Namen und führt (optional) Handler aus
      - attach_dispatcher(obj_or_dict): spätes Binden von Handler-Namen
    In config.BUTTONS kann je Button optional 'on_press' angegeben werden:
      {"name": "next", "pin": 11, "on_press": "next"}   # wird via dispatcher aufgelöst
      oder direkt ein Callable übergeben (nicht üblich in MicroPython-Konfigs).
    """
    def __init__(self, debounce_ms: int = 50):
        self._pins = {}           # name -> Pin
        self._last = {}           # name -> letzter Pegel
        self._last_ts = {}        # name -> letzter Trigger-Zeitpunkt (ms)
        self._on_press = {}       # name -> callable oder string
        self._debounce = debounce_ms
        self._dispatcher = None   # Objekt oder Dict, um Strings auf Methoden zu mappen

        for item in BUTTONS:
            name = item["name"]
            pin_no = item["pin"]
            pin = Pin(pin_no, Pin.IN, Pin.PULL_UP)
            self._pins[name] = pin
            self._last[name] = 1
            self._last_ts[name] = 0
            if "on_press" in item:
                self._on_press[name] = item["on_press"]

    def attach_dispatcher(self, dispatcher):
        """
        dispatcher: Objekt (z. B. PlayerController) ODER Dict {str -> callable}.
        Dient dazu, on_press-Strings (z. B. "play_pause") auf Methoden/Callables aufzulösen.
        """
        self._dispatcher = dispatcher

    def _resolve_callable(self, spec):
        """
        spec kann callable oder string sein. Strings werden gegen dispatcher aufgelöst.
        """
        if callable(spec):
            return spec
        if isinstance(spec, str) and self._dispatcher is not None:
            if isinstance(self._dispatcher, dict):
                fn = self._dispatcher.get(spec)
                return fn if callable(fn) else None
            else:
                fn = getattr(self._dispatcher, spec, None)
                return fn if callable(fn) else None
        return None

    def poll(self):
        """
        Prüft alle Buttons auf fallende Flanke (active low, PullUp).
        Führt bei Treffer optional den Handler aus.
        Gibt Liste der ausgelösten Button-Namen zurück.
        """
        fired = []
        now = utime.ticks_ms()
        for name, pin in self._pins.items():
            v = pin.value()
            if v == 0 and self._last[name] == 1:
                # Debounce
                if utime.ticks_diff(now, self._last_ts[name]) >= self._debounce:
                    fired.append(name)
                    self._last_ts[name] = now
                    # Handler ausführen (falls vorhanden)
                    handler_spec = self._on_press.get(name)
                    if handler_spec is not None:
                        fn = self._resolve_callable(handler_spec)
                        if fn:
                            try:
                                fn()
                            except Exception as e:
                                # Optional: Logging/Hinweis
                                if _DEBUG: print("Button handler error for", name, e)
                                pass
            self._last[name] = v
        return fired
