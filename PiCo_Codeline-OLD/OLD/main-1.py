# main.py
import utime
from machine import Pin, RTC as PicoRTC

from config import (
    PROG_MODE_PIN,
    PROG_MODE_SOURCE,
    WIFI_ENABLED,
    UPLOAD_ENABLED,
    start_sleep_ms,
    _DEBUG
)

# kurze Wartezeit, damit man REPL noch erwischen kann
if _DEBUG == True:
    print("waiting {} milliseconds so you may interrupt initialization".format(start_sleep_ms))
    utime.sleep_ms(start_sleep_ms)
    print("letse go")

from storage import mount_sd
from buttons import Buttons
from volume import Volume
from controller import PlayerController

# Display
print("[MAIN] display setup")
from display import make_display
# NFC
print("[MAIN] nfc setup")
from nfc import make_nfc
# Audio
print("[MAIN] audio setup")
from audio import make_audio
# RTC
print("[MAIN] rtc setup")
from rtc import make_rtc
# Net (WiFi + HTTP)
print("[MAIN] network setup")
from net import make_network, make_http_server


def setup(display, nfc, audio, rtc):
    """
    Initiale Hardware-Initialisierung.
    WiFi wird HIER NICHT mehr verbunden – das passiert nur noch im Prog-Mode.
    """
    display.init()
    display.show_status("Willkommen", "")
    if _DEBUG == True:
        print("[MAIN] mounting SD")
    mount_sd("/")

    # NFC
    if _DEBUG == True:
        print("[MAIN] Initializing NFC")
    try:
        ok = nfc.init()
        if not ok:
            display.show_status("NFC FAIL", "kein Reader?")
        else:
            display.show_status("NFC OK", "")
    except Exception as e:
        print("[NFC] init exception →", e)

    # Audio
    if _DEBUG == True:
        print("[MAIN] Initializing AUDIO")
    audio.init()

    # Uhr vom DS3231 holen, anzeigen + interne Pico-RTC setzen
    try:
        y, m, d, wd, hh, mm, ss = rtc.now()
        try:
            PicoRTC().datetime((y, m, d, wd % 7, hh, mm, ss, 0))
        except Exception:
            print("[RTC] problem retrieving current time from RTC")
            pass
        if hasattr(display, "set_time"):
            display.set_time("{:02d}:{:02d}".format(hh, mm))
        if hasattr(display, "set_date"):
            display.set_date("{:02d}.{:02d}.{:04d}".format(d, m, y))
    except Exception:
        # Uhr nicht kritisch — still weiter machen
        pass

    display.show_status("Ready", "Bitte Tag auflegen")

def is_prog_mode(prog_switch):
    src = (PROG_MODE_SOURCE or "PIN").upper()
    if _DEBUG == True:
        print("[Main] Prog Mode is " + str(PROG_MODE_SOURCE))
    if src == "ACTIVE":
        return True
    if src == "INACTIVE":
        return False
    # Default: "PIN"
    if prog_switch is None:
        return False
    return prog_switch.value() == 0  # active low

# --- Objekt-Erzeugung ---
prog_switch = None
if (PROG_MODE_SOURCE or "PIN").upper() == "PIN":
    prog_switch = Pin(PROG_MODE_PIN, Pin.IN, Pin.PULL_UP)
volume = Volume()
display = make_display()
nfc = make_nfc()
audio = make_audio()
rtc = make_rtc()
wifi = make_network()          # nur Objekt – connect() erst im Prog-Mode
http = make_http_server()      # kann None sein, wenn UPLOAD_DISABLED
ip = None

# HTTP-Server kennt die RTC (für /time)
if http and hasattr(http, "set_rtc"):
    http.set_rtc(rtc)

buttons = Buttons(debounce_ms=80)
pc = PlayerController(display, nfc, audio, rtc, buttons, volume, prog_switch)

# Initiales Setup (ohne WLAN)
setup(display, nfc, audio, rtc)

active_uid = None          # UID, für die Upload erlaubt ist
wifi_ready = False         # WLAN verbunden?
wifi_failed = False        # einmalig fehlgeschlagen -> keine Dauerversuche
prog_prev = False          # vorheriger Zustand des Prog-Schalters

# --- Hauptloop ---
while True:
    # Player übernimmt Normalbetrieb (Audio, Buttons, Uhr im Footer)
    pc.loop()

    # Prog-/Upload-Logik nur, wenn Upload+WiFi grundsätzlich konfiguriert
    if not (UPLOAD_ENABLED and WIFI_ENABLED and wifi and http):
        continue
    
    prog = is_prog_mode(prog_switch)
    
    if prog:
        # --- in den Prog-Mode gewechselt? ---
        if not prog_prev:
            print("[MAIN] Prog-Mode ON")
            # WLAN nur für Prog-Mode hochfahren
            if not wifi_ready and not wifi_failed:
                try:
                    print("[MAIN] Initializing WLAN (Prog-Mode)")
                    _ip = wifi.connect()
                except Exception as e:
                    print("[MAIN] WLAN exception:", e)
                    _ip = None
                if _ip:
                    ip = _ip
                    wifi_ready = True
                    print("[MAIN] WLAN ready, IP:", ip)
                else:
                    wifi_failed = True
                    display.show_status("WLAN FAIL", "")
            # HTTP-Server starten (auch ohne UID), falls WLAN da ist
            if wifi_ready:
                # uid=None → allowed_uid bleibt None, aber Listener wird gestartet
                http.arm(None, ip="0.0.0.0")
        
        # --- Prog-Mode läuft ---
        # NFC-Tag nur hier lesen; PlayerController nutzt NFC im Prog-Mode NICHT mehr.
        uid = nfc.read_uid()
        if uid != active_uid:
            active_uid = uid
            if active_uid:
                # Upload explizit für diese UID erlauben
                http.arm(active_uid)
                print("[MAIN] Upload armed for UID", active_uid)
            else:
                # Tag entfernt: Upload deaktivieren, Server aber laufen lassen (RTC/Web behalten)
                http.allowed_uid = None
                print("[MAIN] Upload disarmed (no tag)")
        
        # Anzeige "Prog-Mode / UID / IP"
        tag_str = active_uid if active_uid else "no tag"
        if wifi_ready and ip:
            ip_str = "http://{}/".format(ip)
        elif wifi_failed:
            ip_str = "WLAN FAIL"
        else:
            ip_str = "no IP"

        if hasattr(display, "show_prog"):
            # Zeigt: "Program-Mode", "UID: <tag_str>", "IP: <ip_str>" + Footer (Zeit/Datum)
            display.show_prog(tag_str, ip_str)
        else:
            display.show_status("Prog-Mode", "{} | {}".format(tag_str, ip_str))

        # HTTP-Poll (non-blocking)
        if wifi_ready:
            http.poll()

    else:
        # --- Prog-Mode aus ---
        if prog_prev:
            print("[MAIN] Prog-Mode OFF")
            # HTTP komplett stoppen
            if http:
                http.disarm()
            # WLAN wieder ausschalten (optional, spart Strom)
            if wifi and wifi_ready:
                wifi.disconnect()
            wifi_ready = False
            wifi_failed = False
            ip = None
            active_uid = None

    prog_prev = prog
