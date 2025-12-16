# net/wifi.py (Pico W)
import network, time
from config import WIFI_SSID, WIFI_PASS

# Optionale Status-Map, um Codes lesbar zu machen
STATUS_MAP = {
    network.STAT_IDLE: "IDLE",
    network.STAT_CONNECTING: "CONNECTING",
    network.STAT_WRONG_PASSWORD: "WRONG_PASSWORD",
    network.STAT_NO_AP_FOUND: "NO_AP_FOUND",
    network.STAT_GOT_IP: "GOT_IP",
}

class WiFi:
    def __init__(self):
        self.wlan = network.WLAN(network.STA_IF)
        self.ip = None

    def _status_str(self, status):
        return "{} ({})".format(status, STATUS_MAP.get(status, "?"))

    def connect(self, timeout_s=20):
        """
        Aktiviert das WLAN-Interface und verbindet sich mit dem konfigurierten AP.
        Gibt die IP als String zurück oder None bei Timeout/Fehler.
        """
        self.wlan.active(True)
        print("[WIFI] connecting to '{}'...".format(WIFI_SSID))
        self.wlan.connect(WIFI_SSID, WIFI_PASS)

        t0 = time.ticks_ms()
        while True:
            st = self.wlan.status()
            if st < 0 or st >= network.STAT_GOT_IP:
                # Fehler (<0) oder erfolgreich (>=GOT_IP)
                break
            if time.ticks_diff(time.ticks_ms(), t0) > timeout_s * 1000:
                print("[WIFI] timeout after {}s, status {}".format(timeout_s, self._status_str(st)))
                return None
            print("[WIFI] waiting, status {}".format(self._status_str(st)))
            time.sleep_ms(500)

        if st == network.STAT_GOT_IP and self.wlan.isconnected():
            cfg = self.wlan.ifconfig()
            self.ip = cfg[0]
            print("[WIFI] connected, ip={}, status {}".format(self.ip, self._status_str(st)))
            return self.ip
        else:
            print("[WIFI] failed with status {}".format(self._status_str(st)))
            return None

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
            print("[WIFI] disconnect error:", e)
        self.ip = None
        print("[WIFI] interface down")
