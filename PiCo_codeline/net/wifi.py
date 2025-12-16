# net/wifi.py (Pico W)
import network, time
from config import (
                    WIFI_SSID,
                    WIFI_PASS,
                    _DEBUG_WEB as _DEBUG
                    )

STATUS_MAP = {}
# Falls dein Port die Konstanten hat, füllen wir sie lesbar:
for name in dir(network):
    if name.startswith("STAT_"):
        STATUS_MAP[getattr(network, name)] = name

class WiFi:
    def __init__(self):
        self.wlan = network.WLAN(network.STA_IF)
        self.ip = None

    def _status_str(self):
        try:
            st = self.wlan.status()
        except Exception:
            return "unknown"
        return "{} ({})".format(st, STATUS_MAP.get(st, "?"))

    def connect(self, timeout_s=20):
        """
        Aktiviert das WLAN-Interface und verbindet sich mit dem konfigurierten AP.
        Gibt die IP als String zurück oder None bei Timeout/Fehler.
        """
        self.wlan.active(True)
        if _DEBUG: print("[WIFI] connecting to '{}'...".format(WIFI_SSID))
        self.wlan.connect(WIFI_SSID, WIFI_PASS)

        t0 = time.ticks_ms()
        while not self.wlan.isconnected():
            # Status ausgeben, damit wir sehen, was passiert
            if _DEBUG: print("[WIFI] waiting, status", self._status_str())
            # Fehlerzustände (< 0) früh abbrechen
            try:
                st = self.wlan.status()
                if st is not None and st < 0:
                    print("[WIFI] failed early with status", self._status_str())
                    return None
            except Exception:
                pass

            if time.ticks_diff(time.ticks_ms(), t0) > timeout_s * 1000:
                if _DEBUG: print("[WIFI] timeout after {}s, last status {}".format(timeout_s, self._status_str()))
                return None
            time.sleep_ms(500)

        # Hier sind wir nur, wenn isconnected() True wurde
        try:
            cfg = self.wlan.ifconfig()
        except Exception:
            cfg = None
        self.ip = cfg[0] if cfg else None
        if _DEBUG: print("[WIFI] connected, ifconfig =", cfg)
        return self.ip

    def ifconfig(self):
        return self.wlan.ifconfig() if self.wlan.isconnected() else None

    def disconnect(self):
        """
        Trennt die Verbindung und deaktiviert das WLAN-Interface.
        Safe, auch wenn keine Verbindung besteht.
        """
        try:
            if self.wlan.isconnected():
                try:
                    self.wlan.disconnect()
                except AttributeError:
                    pass
            self.wlan.active(False)
        except Exception as e:
            if _DEBUG: print("[WIFI] disconnect error:", e)
        self.ip = None
        if _DEBUG: print("[WIFI] interface down")
