# net/__init__.py
from config import (
                    WIFI_ENABLED,
                    UPLOAD_ENABLED
                    )
def make_network():
    if not WIFI_ENABLED:
        return None
    from .wifi import WiFi
    return WiFi()

def make_http_server(rtc=None):
    if not UPLOAD_ENABLED:
        return None
    from .http_server import HttpServer
    return HttpServer(rtc=rtc)
