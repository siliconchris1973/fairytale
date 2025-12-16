# config.py
from machine import Pin, I2C, SPI
"""
        ┌────────── I²C1-BUS (OLED / RTC) ──────────────┐
        │                                               │
        │  ┌──────────────┐     ┌─────────────┐         │
        │  │ SH1106 OLED  │     │  DS3231 RTC │         │
        │  │  (addr 0x3C) │     │    (0x68)   │         │
        │  │              │     │             │         │
        │  │ SDA ◄────────┼─────┼─────────────┼───► SDA │
        │  │ SCL ◄────────┼─────┼─────────────┼───► SCL │
        │  │ VCC ◄────────┼─────┼─────────────┼───► 3V3 │
        │  │ GND ◄────────┼─────┼─────────────┼───► GND │
        │  │ IRQ ──(opt)  │     └─────────────┘         │
        │  └──────────────┘                             │
        └───────────────────────────────────────────────┘ 
            
         5V  ──► 5V  (NFC und Audio)
         3V3 ──► 3V3 (Poti, RTC und OLED)
         GND ──► GND (alle Module)
         
         Poti wiper ──► GP26 ADC0
         
         Buttons & Prog-Switch
         GP10 ── Play/Pause (BTN → GND, Pull-Up)
         GP11 ── Next       (BTN → GND, Pull-Up)
         GP12 ── Prev       (BTN → GND, Pull-Up)
         GP13 ── Stop       (BTN → GND, Pull-Up)
         GP28 ── Prog-Mode  (Swth→ GND, Pull-Up)
         
         OLED/RTC
         I2C 1 / Thread 0           
         SCL ──► GP3
         SDA ──► GP2
         
         
         Adafruit Music Maker / VS1053 Shield (mit microSD)
         SPI 0 / Thread 0
         SCK  VS1053 & SD D13 ◄─── GP18 (SPI0 SCK)
         MOSI VS1053 & SD D11 ◄─── GP19 (SPI0 MOSI)
         MISO VS1053 & SD D12 ◄─── GP16 (SPI0 MISO)
         MCS  VS1053 CS   D7  ───► GP5
         DCS  VS1053 DCS  D6  ───► GP6
         CCS  SD CS       D4  ───► GP8
         DREQ VS1053 DR   D3  ◄─── GP7
         RST                  ───► unused
         
         PN532 NFC Reader
         SPI 1 / Thread 1
         CS           ───► GP13
         RST          ───► None
         SCK          ◄─── GP10
         MOSI         ◄─── GP11 TX
         MISO         ◄─── GP12 RX
"""

# global debug output
_DEBUG_CNF = True
_DEBUG_MAIN = True
_DEBUG_CTRL = True
_DEBUG_AUDIO = False
_DEBUG_VOL = False
_DEBUG_NFC = False
_DEBUG_RTC = False
_DEBUG_DISP = False
_DEBUG_BTN = False
_DEBUG_STAT = True
_DEBUG_STOR = True # für SD und Storage
_DEBUG_WEB = False
_DEBUG_ID3 = False
_DEBUG_TRIG = False

# Texte
oled_text = {"PLAY": "Play >"
             , "PAUSE": "Pause ="
             , "STOP": "Stop"
             , "PREV": "Prev <"
             , "NEXT": "Next >"
             , "VOL_UP": "Volume +"
             , "VOL_DWN": "Volume -"
             , "SHOW_TAG": "Show Tag to play"
             , "WELCOME": "Welcome"
             , "STARTING": "Starting player..."
             , "NO_ALBUM": "No Album found"
             , "NFC_INIT": "Init NFC"
             , "NFC_ERR": "NFC Reader Fail"
             , "NFC_ERR_2": "Board not found"
             , "NFC_OK": "NFC Init done"
             , "AUDIO_INIT": "Init Player"
             , "AUDIO_ERR": "Player Failure"
             , "PROG_MODE": "Prog Mode"
             , "PROG_MODE_OFF": "Closing Prog Mode"
             , "WIFI_CON": "connecting wifi..."
             , "WIFI_FAIL": "connect error"
             , "RTC_INIT": "Init RTC"
             , "RTC_ERR": "RTC Failure"
             , "VOLUME": "Volume"
             }

def t(key: str, default: str = "") -> str:
    """Zentraler Zugriff auf UI-Texte."""
    return oled_text.get(key, default or key)


# config.py
AUDIO_IMPL   = "VS1053"    # Audio Backends:   VS1053, dfplayer, wav_pwm oder mock
SD_IMPL      = "sd"        # SD Backends:      sd oder mock
DISPLAY_IMPL = "sh1106"    # Display Backends: lcd1602, sh1106, ssd1306, tft oder mock
NFC_IMPL     = "pn532_spi" # NFC Backends:     pn532_spi oder mock
RTC_IMPL     = "ds3231"    # RTC Backends:     ds3231 oder mock
VOLUME_IMPL  = "poti"      # Volume backend:   poti, buttons / btn / key oder mock
PROG_MODE_SOURCE = "pin"   # can either be pin, active (mocked active) or inactive (mocked inactive)

start_sleep_ms = 5000 # number of milliseconds the main rountine shall wait before initializing all the hardware

# --- WLAN / Upload ---
# ssid und password fürdas wlan finden sich in secrets.py:
# WIFI_SSID="my_wlan"
# WIFI_PASS="my_wifi_pass"
#
try:
    from secrets import (
                        WIFI_SSID,
                        WIFI_PASS
                        )
except ImportError:
    WIFI_SSID = None
    WIFI_PASS = None
    
WIFI_ENABLED   = False 
UPLOAD_ENABLED = False 
UPLOAD_PORT    = 80


# ---------- I2C für Display und RTC GP2/GP3 ----------
I2C_RTC_OLED_ID = 1
I2C_RTC_OLED_SCL = 3   # GP3
I2C_RTC_OLED_SDA = 2   # GP2
I2C_RTC_OLED_FREQ = 400_000
# I2C-Bus aufbauen (gemeinsam für RTC/Display)
i2c = I2C(I2C_RTC_OLED_ID, scl=Pin(I2C_RTC_OLED_SCL), sda=Pin(I2C_RTC_OLED_SDA), freq=I2C_RTC_OLED_FREQ)


#  ---------- NFC über SPI ---------- 
NFC_SPI_ID   = 1
NFC_SPI_CS   = 13
NFC_SPI_RST  = None
NFC_SPI_SCK  = 10
NFC_SPI_MOSI = 11 #TX
NFC_SPI_MISO = 12 #RX
NFC_IRQ_PIN  = None
# Optionale Tuning-Werte
NFC_SPI_BAUD = 1_000_000   # bei Problemen: 250_000
NFC_READ_TIMEOUT_MS = 500  # Lese-Timeout pro Versuch

# das SPI für PN532 wird nicht hier, sondenr im PN532 aufgebaut


# ---------- Adafruit mit SD über SPI ------------
# Adafruit Music Maker
AUDIO_SPI_ID       = 0
AUDIO_SPI_SCK_PIN  = 18 # → an D13 (SCK)
AUDIO_SPI_MOSI_PIN = 19 # → an D11 (MOSI)
AUDIO_SPI_MISO_PIN = 16 # → an D12 (MISO)

# SD Card auf Adafruit Music Maker
VS1053_CS_PIN      = 5 # → an D7 VS1053 CS
VS1053_DCS_PIN     = 6 # → an D6 VS1053 DCS
VS1053_DREQ_PIN    = 7 # → an D3 VS1053 DREQ
VS1053_RST_PIN     = -1 #17

SD_CS_PIN          = 8 # → an D4 SD CS
# SPI-Bus für Audio und SD Karte - sollte in audio verschoben werden:
if _DEBUG_CNF == True:
    print("[CONF] initializing audio/sd spi on spi"
          + str(AUDIO_SPI_ID)
          + " SCK="
          + str(AUDIO_SPI_SCK_PIN)
          + " MOSI="
          + str(AUDIO_SPI_MOSI_PIN)
          + " MISO="
          + str(AUDIO_SPI_MISO_PIN))
audio_spi = SPI(AUDIO_SPI_ID, baudrate=8_000_000, polarity=0, phase=0,
          sck=Pin(AUDIO_SPI_SCK_PIN), mosi=Pin(AUDIO_SPI_MOSI_PIN), miso=Pin(AUDIO_SPI_MISO_PIN))


# -------- TFT Touch Display über SPI ---------- 
#TFT_SPI_ID     = 1
#TFT_SCK        = 10
#TFT_MOSI       = 11
#TFT_MISO       = 12    # optional, meist ungenutzt
#TFT_DC         = 9
#TFT_RST        = 8
#TFT_CS         = 13
#TFT_BL         = 15    # Backlight (optional) - HIGH=an
#TFT_WIDTH      = 240
#TFT_HEIGHT     = 240


# ---------- OLED Display über I2C ------------
DIS_I2C_ADDR = 0x3C
OLED_WIDTH = 128
OLED_HEIGHT = 64


# ---------- RTC über I2C ---------- 
RTC_I2C_ADDR = 0x68    # DS3231-Standard


# ---------- Buttons ----------
# active low, interner PullUp
BTN_PLAY_PAUSE = 20
BTN_NEXT       = 21
BTN_PREV       = 22
BTN_STOP       = 27
# Welche Buttons werden abgefragt – inkl. (optional) Handler-Namen,
# die später per dispatcher (z. B. PlayerController) aufgelöst werden.
BUTTONS = [
    {"name": "play_pause", "pin": BTN_PLAY_PAUSE, "on_press": "play_pause"}
    , {"name": "next",       "pin": BTN_NEXT,       "on_press": "next"}
    , {"name": "prev",       "pin": BTN_PREV,       "on_press": "prev"}
    , {"name": "stop",       "pin": BTN_STOP,       "on_press": "stop"}
]

if VOLUME_IMPL in ("buttons", "btn", "key"):
    BTN_VUP        = 14
    BTN_VDN        = 15
    BUTTONS.append({"name": "volume_up", "pin": BTN_VUP})
    BUTTONS.append({"name": "volume_down", "pin": BTN_VDN})
elif VOLUME_IMPL == 'poti':
    # ---------- Poti (Volume) ----------
    POTI_ADC_PIN = 26    # ADC0 (achte darauf, dass SDA NICHT auf 26 liegt)
    VOLUME_INVERT = True # oder False wenn nicht True, dann ist links lauert und rechts leiser

# used to make volume increase/decrease smooth when using the ADC/Poti
VOLUME_MIN_RAW = 4500
VOLUME_MAX_RAW = 54500
VOLUME_GAMMA = 0.7


# ---------- Programmiermodus-Schalter ----------
# Programmiermodus-Schalter (active low, PullUp)
PROG_MODE_PIN = 28

# ---------- Pfade & Display/ Hardware Auswahl ----------
MOUNT_DIR  = "/sd"
AUDIO_ROOT = "/sd/audio"
STATE_DIR  = "/sd/appstate"   # optional, aber konsistent

# shall we use ID3 Tags to show artist album etc.
_USE_ID3_TAG = True

# Eine Mapping-Datei, z.B. falls du später UID≠Verzeichnisnamen haben willst
MAPPING_FILE = "tag_album.json"

# VS1053 Streaming-Chunk
_STREAM_CHUNK    = 1024   # Wieviel bytes pro chunk in den Puffer gehen
_MAX_FEED_CHUNKS = 6      # 4 * STREAM_CHUNK
_MAX_FEED_MS     = 40     # nicht länger als 40 ms am Stück füttern

# sets the time between checks for TAG presense while in playback
_TIMEOUT_FOR_IDLE_NFC_CHECK = 1000
_TIME_BETWEEN_TAG_CHECKS_IN_MS = 1000
_TIMEOUT_FOR_TAG_CHECK_IN_MS   = 35
_MISSES_BEFORE_TAG_LOST        = 3