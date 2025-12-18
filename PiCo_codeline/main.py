# main.py
# threads are used for the loop, so we can utilize kernel 0 or AUDIO and 1 for NFC
from machine import Pin, RTC as PicoRTC
import _thread
import utime

from config import (MOUNT_DIR
                    , PROG_MODE_PIN
                    , PROG_MODE_SOURCE
                    , WIFI_ENABLED
                    , UPLOAD_ENABLED
                    , _DEBUG_MAIN as _DEBUG
                    , start_sleep_ms
                    , t
                    )

# wait routine prior initializing all the hardware - set to 0 in config to do direct jump start
if _DEBUG == True:
    import utime
    print("waiting {} milliseconds so you may interrupt initialization".format(start_sleep_ms))
    utime.sleep_ms(start_sleep_ms)
    print("letse go")


if _DEBUG: print("[MAIN] sourcing storage")
import storage as storage_mod
if _DEBUG: print("[MAIN] sourcing buttons")
from buttons import Buttons
if _DEBUG: print("[MAIN] sourcing volume")
from volume import Volume
if _DEBUG: print("[MAIN] sourcing controller")
from controller import PlayerController
if _DEBUG: print("[MAIN] sourcing display")
from display import make_display
if _DEBUG: print("[MAIN] sourcing nfc")
from nfc import make_nfc
if _DEBUG: print("[MAIN] sourcing audio")
from audio import make_audio
if _DEBUG: print("[MAIN] sourcing rtc")
from rtc import make_rtc
if _DEBUG: print("[MAIN] sourcing network")
from net import make_network, make_http_server
if _DEBUG: print("[MAIN] sourcing trigger")
from trigger_nfc_idle import NfcIdleTrigger
from trigger_buttons import ButtonTrigger

class StorageAdapter:
    # stellt genau die Methoden bereit, die controller.py nutzt
    def list_tracks_for_uid(self, uid, exts=(".mp3", ".wav")):
        return storage_mod.list_tracks_for_uid(uid, exts)

    def load_uid_state(self, uid, default=None):
        return storage_mod.load_uid_state(uid, default)

    def save_uid_state(self, uid, obj):
        return storage_mod.save_uid_state(uid, obj)
storage = StorageAdapter()

def setup(display, nfc, audio, wifi, rtc):
    """Einmaliges Hardware-Setup ohne WLAN-Verbindung.
    WLAN wird erst im Prog-Mode aufgebaut.
    """
    display.init()
    display.show_status(t("WELCOME", "Welcome"), t("STARTING", "Starting..."))
    
    # SD mount einmal im Boot / Setup
    if _DEBUG: print("[MAIN] mounting SD at " + str(MOUNT_DIR))
    storage_mod.mount_sd(MOUNT_DIR)
    
    if _DEBUG: print("[MAIN] Initializing NFC")
    display.show_status(t("NFC_INIT", "Init NFC"))
    try:
        ok = nfc.init()
        if _DEBUG:
            print("[MAIN] NFC quick test read...")
            print(nfc.read_uid(timeout_ms=5000))
        if not ok:
            display.show_status(t("NFC_ERR", "NFC Failure"), t("NFC_ERR_2", "No Reader?"))
        else:
            display.show_status(t("NFC_OK", "NFC Init done"))
    except Exception as e:
        if _DEBUG: print("[NFC] init exception →", e)
        display.show_status(t("NFC_ERR", "NFC Failure"), str(e))
    
    if _DEBUG: print("[MAIN] Initializing AUDIO")
    display.show_status(t("AUDIO_INIT", "Init Player"), "")
    audio.init()
    
    # Uhr vom (Fake)RTC holen, anzeigen + interne Pico-RTC setzen
    if _DEBUG: print("[MAIN] RTC Init")
    display.show_status(t("RTC_INIT", "Init RTC"))
    try:
        if _DEBUG: print("[MAIN] Initializing RTC")
        y, m, d, wd, hh, mm, ss = rtc.now()
        try:
            PicoRTC().datetime((y, m, d, wd % 7, hh, mm, ss, 0))
        except Exception:
            if _DEBUG: print("[MAIN] error setting RTC, but we just pass")
            display.show_status(t("RTC_ERR", "RTC Failure"))
            pass
        
        # this is possibly not correct - as we set the date and time here
        if hasattr(display, "set_time"):
            display.set_time("{:02d}:{:02d}".format(hh, mm))
        if hasattr(display, "set_date"):
            display.set_date("{:02d}.{:02d}.{:04d}".format(d, m, y))
    except Exception:
        # Uhr nicht kritisch — still weitermachen
        if _DEBUG: print("[MAIN] general error initializing RTC, but we just pass")
        pass
    
    display.show_status(t("WELCOME", "Welcome"), t("SHOW_TAG", "Show Tag to play"))
    # wifi wird nicht verändert, nur zurückgereicht
    return display, nfc, audio, wifi, rtc


def is_prog_mode(prog_switch):
    """Zentrale Auswertung des Prog-Mode-Zustands.
    
    PROG_MODE_SOURCE:
      - "PIN"      → echten PROG_MODE_PIN lesen (active low)
      - "ACTIVE"   → immer Prog-Mode (Simulation)
      - "INACTIVE" → nie Prog-Mode
    """
    src = (PROG_MODE_SOURCE or "PIN").upper()
    if _DEBUG: print("[Main] Prog Mode is " + str(PROG_MODE_SOURCE))
    if src == "INACTIVE" or prog_switch is None:
        return False
    elif src == "ACTIVE":
        return True
    return prog_switch.value() == 0  # active low


# --- Objekt-Erzeugung ---
prog_switch = Pin(PROG_MODE_PIN, Pin.IN, Pin.PULL_UP) if (PROG_MODE_SOURCE or "PIN").upper() == "PIN" else None
volume = Volume()
display = make_display()
nfc = make_nfc()
audio = make_audio()
rtc = make_rtc()
wifi = make_network()
http = make_http_server()
ip = None

# RTC an HTTP-Server durchreichen, falls unterstützt (für /time)
if http and hasattr(http, "set_rtc"):
    if _DEBUG: print("[MAIN] setting up rtc for http")
    http.set_rtc(rtc)

# Buttons kommen jetzt aus der Config
buttons = Buttons(debounce_ms=80)

# Initiales Setup (ohne WLAN-Verbindung)
display, nfc, audio, wifi, rtc = setup(display, nfc, audio, wifi, rtc)

triggers = [
    ButtonTrigger(buttons) # STOP hat Priorität
    , NfcIdleTrigger(nfc)  # START nur im Idle
]

pc = PlayerController(display
                        , audio
                        , storage
                        , rtc
                        , buttons
                        , triggers
                        , volume)

if hasattr(buttons, "attach_dispatcher"):
    if _DEBUG: print("[MAIN] setting up buttons for controller")
    buttons.attach_dispatcher(pc)

def _audio_task(pc):
    # Core1: nur feed, so schnell wie nötig
    while True:
        pc.feed_audio_only()
        utime.sleep_ms(1)  # 0..1ms ist ok, 1ms ist meist stabiler

# Audio-Feeding auf Core1 starten
_thread.start_new_thread(_audio_task, (pc,))

# --- Programmiermodus-gesteuerter Upload & WLAN ---
active_uid = None
wifi_ready = False
wifi_failed = False
prog_prev = False


if _DEBUG: print("[MAIN] entering main Audio loop")
while True:
    pc.loop()
    
    # Upload-/Netzwerk-Logik nur, wenn grundsätzlich aktiviert
    if not (UPLOAD_ENABLED and WIFI_ENABLED and wifi and http):
        continue
    
    prog = is_prog_mode(prog_switch)
    
    if prog:
        pc.stop()
        # Übergang in den Prog-Mode?
        if not prog_prev:
            if _DEBUG: print("[MAIN] Prog-Mode ON")
            display.show_status(oled_text['PROG_MODE'])
            # WLAN nur beim Wechsel in den Prog-Mode aufbauen
            if not wifi_ready and not wifi_failed:
                try:
                    if _DEBUG: print("[MAIN] Initializing WLAN (Prog-Mode)")
                    display.show_status(t("PROG_MODE", "Prog Mode"), t("WIFI_CON", "connecting wifi..."))
                    _ip = wifi.connect()
                except Exception as e:
                    if _DEBUG: print("[MAIN] WLAN exception:", e)
                    _ip = None
                if _ip:
                    ip = _ip
                    wifi_ready = True
                    if _DEBUG: print("[MAIN] WLAN ready, IP:", ip)
                else:
                    wifi_failed = True
                    ip = None
                    display.show_status(t("PROG_MODE", "Prog Mode"), t("WIFI_FAIL", "connect error"))
            
            # HTTP-Server starten (auch wenn noch kein Tag da ist),
            # damit z.B. /time (RTC) sofort funktioniert.
            if wifi_ready:
                http.arm(None, ip="0.0.0.0")
        
        # --- Prog-Mode aktiv ---
        # NFC-Tag nur hier lesen; PlayerController nutzt NFC im Prog-Mode nicht mehr.
        uid = nfc.read_uid()
        if uid != active_uid:
            active_uid = uid
            if active_uid:
                # Upload explizit für diese UID erlauben
                if hasattr(http, "arm"):
                    http.arm(active_uid)
                if _DEBUG: print("[MAIN] Upload armed for UID", active_uid)
            else:
                # Tag entfernt: Upload deaktivieren, Server aber laufen lassen (RTC/Web behalten)
                if hasattr(http, "allowed_uid"):
                    http.allowed_uid = None
                if _DEBUG: print("[MAIN] Upload disarmed (no tag)")
        
        # Anzeige "Prog-Mode / UID / IP"
        tag_str = active_uid if active_uid else "no tag"
        if wifi_ready and ip:
            ip_str = ip
        elif wifi_failed:
            ip_str = "WLAN FAIL"
        else:
            ip_str = "no IP"
        
        if hasattr(display, "show_prog"):
            # Dein OledUI.show_prog(uid, ip) zeigt:
            #  Program-Mode
            #  UID: ...
            #  IP: ...
            display.show_prog(tag_str, ip_str)
        else:
            if _DEBUG: print("[MAIN] Prog-Mode OFF")
            display.show_status(t("PROG_MODE_OFF", "Closing Prog Mode"), t("STARTING", "Starting player..."))
        
        # HTTP poll (non-blocking)
        if wifi_ready:
            http.poll()
    
    else:
        # Prog-Mode aus
        if prog_prev:
            if _DEBUG: print("[MAIN] Prog-Mode OFF")
            display.show_status(t("PROG_MODE_OFF", "Closing Prog Mode"), t("STARTING", "Starting player..."))
            # HTTP komplett stoppen
            if http and hasattr(http, "disarm"):
                http.disarm()
            # WLAN wieder ausschalten (optional, spart Strom)
            if wifi and wifi_ready and hasattr(wifi, "disconnect"):
                wifi.disconnect()
            wifi_ready = False
            wifi_failed = False
            ip = None
            active_uid = None
    
    prog_prev = prog
