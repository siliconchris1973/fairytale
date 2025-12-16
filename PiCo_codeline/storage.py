# storage.py
import os
from machine import Pin
from config import (
                    audio_spi as spi,
                    SD_CS_PIN,
                    SD_IMPL,
                    MOUNT_DIR,
                    AUDIO_ROOT,
                    STATE_DIR,
                    MAPPING_FILE
                    )
from config import (
                    VS1053_CS_PIN,
                    VS1053_DCS_PIN,
                    SD_CS_PIN,
                    _DEBUG_STOR as _DEBUG
                    )

# JSON für State-Dateien
try:
    import ujson as json
except ImportError:
    import json

# ---------- SD-Mount ----------
def mount_sd(mount_point="/sd"):
    """
    Mountet die SD-Karte auf mount_point (default: /sd).
    Wenn SD_IMPL ein Mock ist, bleibt nur das interne FS (/).
    """
    if SD_IMPL in ("mock", "fake", "none", "off", "null", ""):
        if _DEBUG: print("[STOR] mocked (internes FS)")
        return "/"
    
    if _DEBUG: print("[STOR] mounting sd card")
    try:
        from libs.sdcard import SDCard
        
        # 1. Alle CS-Pins definieren und auf HIGH setzen
        # notwendig, damit ein soft reboot nicht zu einem SD Not Found Fehler führt.
        Pin(VS1053_CS_PIN,  Pin.OUT, value=1)
        Pin(VS1053_DCS_PIN, Pin.OUT, value=1)
        cs_sd = Pin(SD_CS_PIN, Pin.OUT, value=1)
        
        sd = SDCard(spi, Pin(SD_CS_PIN, Pin.OUT))   # robert-hh Treiber
        os.mount(sd, mount_point)
        if _DEBUG: print("[STOR] SD mounted at", mount_point)
        return mount_point
    except Exception as e:
        if _DEBUG: print("[STOR] SD-Mount fehlgeschlagen: ", e)
        return "/"
    
# ---------- Generische FS-Helper ----------
def listdir(path):
    """
    Liefert eine sortierte Liste von Eintragsnamen unterhalb von `path`,
    ohne versteckte Einträge (die mit "." anfangen).
    Arbeitet robust mit str/bytes-Namen, wie sie os.listdir() liefern kann.
    """
    try:
        entries = []
        for p in os.listdir(path):
            # MicroPython kann str oder bytes zurückgeben
            name = p
            if isinstance(p, bytes):
                try:
                    # Erst UTF-8 versuchen
                    name = p.decode("utf-8")
                except Exception:
                    try:
                        # Fallback latin-1
                        name = p.decode("latin-1")
                    except Exception:
                        # Wenn gar nicht decodierbar → Eintrag ignorieren
                        continue
            # Jetzt ist name sicher ein str
            if not name.startswith("."):
                entries.append(name)
        entries.sort()
        return entries
    except OSError:
        return []

def exists(path):
    try:
        os.stat(path)
        return True
    except OSError:
        return False

def _ensure_dir(path: str):
    """
    Stellt sicher, dass ein Pfad (rekursiv) existiert.
    """
    if not path or path == "/":
        return
    parts = [p for p in path.split("/") if p]
    cur = ""
    for p in parts:
        cur = cur + "/" + p
        try:
            os.mkdir(cur)
        except OSError:
            pass

# ---------- Hörspiel-spezifische Helper (AUDIO_ROOT_ROOT & UID) ----------
def album_dir_for_uid(uid: str) -> str:
    """
    Liefert das Verzeichnis für ein Hörspiel-Album zu einer UID.
    Beispiel: AUDIO_ROOT="/audio", uid="04714AC73C4189" → "/sd/audio/04714AC73C4189"
    """
    base = AUDIO_ROOT.rstrip("/")
    if _DEBUG: print("[STOR] album dir: ", base + "/" + uid)
    return "{}/{}".format(base, uid)

def ensure_album_dir(uid: str) -> str:
    """
    Stellt sicher, dass das Verzeichnis für eine UID existiert.
    Gibt den Pfad zurück.
    """
    d = album_dir_for_uid(uid)
    _ensure_dir(d)
    return d

def list_tracks_for_uid(uid: str, exts=(".mp3", ".wav")):
    """
    Gibt (album_dir, [Dateinamen]) SORTIERT für alle Tracks einer
    UID zurück. Nur Dateien mit der angegebenen Erweiterung werden
    geliefert. Dateinamen sind relativ zum Album-Verzeichnis (ohne Pfad).
    """
    d = album_dir_for_uid(uid)
    if not exists(d):
        return d, []
    
    try:
        files = listdir(d)
    except Exception:
        return d, []
    
    exts_l = tuple(e.lower() for e in exts)
    tracks = [f for f in files if any(f.lower().endswith(ext) for ext in exts_l)]
    if not tracks:
        return d, []
    
    # sort by numeric prefix if possible, otherwise by name
    def num_key(name):
        try:
            return int(name.split(".", 1)[0])
        except Exception:
            return 999999
    
    tracks_sorted = sorted(tracks, key=lambda f: (num_key(f), f))
    if _DEBUG: print("[STOR] tracks for uid", uid, "in", d, "->", tracks)
    return d, tracks_sorted

def pick_first_track(uid: str, exts=(".mp3", ".wav")):
    """
    Liefert den vollständigen Pfad zum ersten Track für eine UID
    (sortiert nach Dateiname), oder None falls nichts vorhanden.
    """
    d, tracks = list_tracks_for_uid(uid, exts=exts)
    if not tracks:
        return None
    tracks.sort()
    
    if _DEBUG: print("[STOR] 1st track found as " + str(tracks[0]))
    return d.rstrip("/") + "/" + tracks[0]

def save_file_for_uid(uid: str, filename: str, data: bytes) -> str:
    """
    Speichert eine Datei für eine bestimmte UID in deren Album-Verzeichnis.
    Gibt den vollständigen Pfad zurück.
    """
    d = ensure_album_dir(uid)
    path = d.rstrip("/") + "/" + filename
    with open(path, "wb") as f:
        f.write(data)
    
    if _DEBUG: print("[STOR] writing file ", path)
    return path

# ---------- STATE_DIR / JSON-State ----------
def _ensure_state_dir():
    _ensure_dir(STATE_DIR)

def _state_file(name: str) -> str:
    return STATE_DIR.rstrip("/") + "/" + name

def load_state(name: str, default=None):
    """
    Lädt eine JSON-State-Datei aus STATE_DIR.
    name: z.B. "mapping.json" oder "uid_04714AC73C4189.json"
    Gibt default zurück, wenn Datei fehlt oder kaputt ist.
    """
    _ensure_state_dir()
    path = _state_file(name)
    try:
        with open(path, "r") as f:
            return json.load(f)
    except (OSError, ValueError) as e:
        if _DEBUG: print("[STOR] Exception during state file load ", e)
        return default

def save_state(name: str, obj) -> None:
    """
    Speichert ein Objekt als JSON in STATE_DIR.
    Nutzt ein .tmp-File und Rename, damit nichts halb geschrieben bleibt.
    """
    _ensure_state_dir()
    path = _state_file(name)
    tmp = path + ".tmp"
    try:
        with open(tmp, "w") as f:
            json.dump(obj, f)
        try:
            os.remove(path)
        except OSError:
            pass
        os.rename(tmp, path)
    except Exception as e:
        if _DEBUG: print("[STOR] save_state failed:", name, e)

# ---------- Pro-UID-States (z.B. letzte Position) ----------
def _uid_state_name(uid: str) -> str:
    # einfache Namenskonvention: eine Datei pro UID
    return "uid_{}.json".format(uid)

def load_uid_state(uid: str, default=None):
    """
    Lädt den State für eine bestimmte UID.
    Typischer Inhalt: {"last_track": "...", "offset": 12345}
    """
    if default is None:
        default = {}
    return load_state(_uid_state_name(uid), default)

def save_uid_state(uid: str, obj) -> None:
    """
    Speichert den State für eine bestimmte UID.
    """
    save_state(_uid_state_name(uid), obj)

# ---------- Tag→Album-Mapping ----------
def load_tag_album_map():
    """
    Lädt das Tag→Album-Mapping als Dict: {uid: album_id, ...}
    Aktuell brauchst du vielleicht noch keine album_id != uid,
    aber die Funktion ist vorbereitet.
    """
    m = load_state(MAPPING_FILE, default={})
    if m is None:
        m = {}
    return m

def save_tag_album_map(mapping: dict) -> None:
    """
    Speichert das Tag→Album-Mapping.
    """
    save_state(MAPPING_FILE, mapping)

def map_uid_to_album(uid: str, album_id: str) -> None:
    """
    Setzt/aktualisiert den Eintrag uid → album_id im Mapping.
    """
    mapping = load_tag_album_map()
    mapping[uid] = album_id
    save_tag_album_map(mapping)
