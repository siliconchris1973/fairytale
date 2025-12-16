# NFC Audio Player für Raspberry Pi Pico
Ein NFC‑gesteuerter Audioplayer auf Basis eines Raspberry Pi Pico, eines Adafruit Music Maker Shields (VS1053 mit SD‑Slot), 
PN532‑NFC‑Reader, SH1106‑OLED und DS3231‑RTC.  
Über einen kleinen HTTP‑Server können im Programmiermodus:
- die RTC Uhr gestellt werden
- ein Verzeichnis unter /audio auf der sd-Karte so umbenannt werden, 
  dass es der Tag UID entspricht - dadurcvh wird dieses Verzeichnis mit dem Tag verknüpft
- Neue Audio-Dateien zu einem aufgelegten Tag auf die SD Karte hochgeladen werden

## Features
- Wiedergabe von MP3‑Dateien über VS1053 vom SD‑Karten‑Dateisystem.
- Steuerung per NFC‑Tags: jedem Tag wird ein „Album“ auf der SD‑Karte zugeordnet - Tag ID = Directory name.
- Programmiermodus (Prog‑Mode) über Hardware‑Schalter und Web‑Interface:
  - WLAN‑Aufbau nur im Prog‑Mode.
  - HTTP‑Upload von Dateien für die aktuell aufgelegte NFC‑UID.
  - Browsen und Löschen von Dateien, Stellen der RTC‑Uhr.
- Persistente Wiedergabestände pro UID (Kapitel, Offset, Volume).
- ID3‑Tag‑Auswertung (Titel, Album, Artist) zur Anzeige im Display.
- Konfigurierbares Debug‑Logging und vielfältige Mock‑Module für Tests (Mock‑NFC, Mock‑Display, Mock‑Audio, Mock‑RTC).

## Hardware
- Raspberry Pi Pico 2 WLAN
- Adafruit Music Maker / VS1053‑Shield 'audio/vs1053.py' (SPI, Audio‑Ausgang) Version von 2017
- PN532‑NFC‑Board (SPI, separates Modul `lib/NFC_PN532.py` plus `nfc/pn532_spi_cargl.py`)
- ZUKÜNFTIG ATTINY, der den PN532 ansteuert und das aktuelle TAG per UART zurückgibt
- SH1106‑OLED (über `display/sh1106_oled.py` und `display/oled_common.py`)
- DS3231‑RTC (I²C) über `rtc/ds3231.py`
- Programmiermodus‑Schalter an `PROG_MODE_PIN` (active low)
- WLAN‑Modul, das durch `net/wifi.py` implementiert wird

Die konkreten Pin‑Belegungen und WLAN‑Zugangsdaten werden in `config.py` konfiguriert.

## Projektstruktur (wichtige Module)
- main.py  
  Initialisiert Hardware, konfiguriert alle Komponenten und übergint sie 
  an den PlayerController. Überwacht den Prog-Mode Butzton und steuert den 
  controller nur an, wenn nicht prog_mode. 
- net/http_server.py / net/web.py
  Kleiner nicht‑blockierender HTTP‑Server mit Endpunkten:
  - `/` – Startseite mit Status, Upload‑Info und Links.
  - `/upload` – GET zeigt Formular, POST nimmt Dateien an (nur wenn `allowed_uid` gesetzt).
  - `/browse` – Verzeichnislisting (Pfad über `path`‑Query).
  - `/delete` – Datei löschen.
  - `/time` – RTC anzeigen/setzen.
  Im Prog-Mode wird von http_server.py der web serbver aufgebaut und von web.py
  die Erzeugung neuer Alben auf der SD Karte und das setzen der RTC Uhr übernommen.
- controller.py
  Zentrale Audio-Ausgabe: kümmert sich um Play/Pause/Next/Prev und die Ausgabe 
  des Fortschritts, der Lautstärke und der Uhr auf dem Display.
  Macxht keine direkte NFC Überprüfung, sondern nutzt dafür ein Trigger-System. 
  Dieses übergibt eine UID, dann play start oder ein stop-signalö, (derzeit Button, 
  zuküünftig Tag weg) für Play Stop.
- storage.py
  Kapselt Dateisystem‑Operationen, u.a. Dateilisten für eine UID, Laden/Speichern von UID‑State, 
  Speichern hochgeladener Dateien.
- vs1053.py / audio.py
  Abstraktion für Audiowiedergabe: `start(path, offset)`, `feed()`, `stop()`, `pause()`, `resume()`, 
  `set_volume()` und Eigenschaften `total_bytes`, `pos_bytes`.
- lib/NFC_PN532.py / nfc/pn532_spi_cargl.py
  Zugriff auf PN532; mindestens `init()` und `read_uid(timeout_ms=...)` werden genutzt.
- display/oled_common.py, display/sh1106.py, display/sh1106_oled.py, display/touch_display.py  
  Display‑Abstraktion, die Funktionen wie `show_status`, `show_play`, `show_stop`, `show_idle`, 
  `show_prog`, `set_time`, `set_date`, `set_volume`, `set_progress_text` etc. bereitstellt.
- buttons.py
  Liest Taster mit Entprellung und liefert Events (`play_pause`, `next`, `prev`, `stop`) über `poll()`. 
  Optionaler Dispatcher.
- volume.py
  Gibt pro Änderung ein Lautstärke‑Delta als Prozentwert zurück (`changed()`) und speichert letzten Wert.
- `ds3231.py`, `rtc.py` / `mock_rtc.py`  
  RTC‑Abstraktion; `rtc.now()` liefert `(y, m, d, wd, hh, mm, ss)`.
- id3.py
  Liest einfache ID3‑Tags aus MP3‑Dateien und liefert ein Dictionary mit `title`, `album`, `artist`, `track` etc.
- config.py
  Zentrale Konfigurationswerte (Pins, Pfade, Debug‑Flags, Prog‑Mode‑Quelle, Zeit‑Konstanten für NFC‑Checks usw.).
- diverse trigger-Dateien
  abstrahiert die Übergabe des Tags von NFC an controller und das setzen eines Stop Events (derzeit per Button)
  um das Beenden der Wiedergabe zu signalisieren

## Installation
1. Repository klonen und Projektdateien auf den Pico (MicroPython) kopieren.
2. `config.py` anpassen:
   - WLAN‑Parameter (SSID, Passwort).
   - Dateipfade (z. B. `AUDIO_ROOT`, `STATE_DIR`).
   - `PROG_MODE_PIN` und `PROG_MODE_SOURCE` („PIN“, „ACTIVE“, „INACTIVE“).
3. SD‑Karte vorbereiten:
   - Basis‑Verzeichnisstruktur wie in `storage.py` vorgesehen anlegen (z. B. pro UID ein Unterordner).
   - Test‑MP3‑Dateien einspielen.
4. Hardware wie in der Konfiguration verdrahten (SPI, I²C, GPIOs).

## Nutzung
### Normalmodus (Audio‑Player)
- Gerät starten.
- OLED zeigt Begrüßung und „Show Tag to play“.
- NFC‑Tag auflegen:
  - NFC IMplementeiorung erkennt neue UID via `nfc.read_uid()` und starte Audfio im Controller.
- Steuerung:
  - Taster: `play_pause`, `next`, `prev`, `stop` (via `buttons.poll()`).
  - Rotary/Volume‑Input: Änderung führt zu `audio.set_volume()` und Anzeige im OLED.
- Fortschritt:
  - `audio.feed()` wird im Hauptloop regelmäßig aufgerufen; Prozentanzeige basiert auf `pos_bytes`/`total_bytes`.
- Tag‑Präsenz wird derzeit nicht geprüft, wird zuküpnftig durch externen MicroController realisiert:
  - Wenn auf ATTINY implementiert, dann wird per UART Tag Weg signalisiert, indem die Tag ID auf NOne gesetzt wird.
    Dies stoppt dann die Audio-Ausgabe.

### Programmiermodus und HTTP‑Upload
- PROG‑Schalter aktivieren (active low, abhängig von `PROG_MODE_SOURCE`).
- Beim Wechsel in den Prog‑Mode:
  - WLAN wird aufgebaut (`wifi.connect()`), IP‑Adresse im Display angezeigt.
  - HTTP‑Server wird „gearmed“ und an `0.0.0.0:UPLOAD_PORT` gebunden.
- NFC‑Tag im Prog‑Mode auflegen:
  - `nfc.read_uid()` im Main Loop liest UID, `active_uid` wird gesetzt und an den HTTP‑Server über `http.arm(uid)` übergeben.
  - Upload ist nun für diese UID freigeschaltet (`allowed_uid`).
- Browser:
  - IP des Geräts im Browser öffnen (z. B. `http://<pico-ip>:<UPLOAD_PORT>/`).
  - Dateien für diese UID hochladen, Verzeichnisse durchsuchen, Dateien löschen und RTC stellen.
- Beim Verlassen des Prog‑Mode:
  - Upload wird deaktiviert, HTTP‑Server optional „disarmed“ und WLAN getrennt.

## Entwicklungs‑ und Testunterstützung
- Mock‑Module (`mock_nfc.py`, `mock_display.py`, `mock_audio.py`, `mock_rtc.py`) erlauben lokale Tests ohne echte Hardware.
- Umfangreiche Debug‑Ausgaben über `_DEBUG_*`‑Flags in `config.py` helfen beim Tracing von NFC‑Events, HTTP‑Requests, Audio‑Timing etc.

## Lizenz
Creative Commons (CC) Lizenz