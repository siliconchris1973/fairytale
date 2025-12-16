# id3.py – schlankes ID3-Parsing für MicroPython
import os
from config import _DEBUG_ID3 as _DEBUG

def _syncsafe_to_int(b):
    # 4 Bytes syncsafe -> int
    return ((b[0] & 0x7F) << 21) | ((b[1] & 0x7F) << 14) | ((b[2] & 0x7F) << 7) | (b[3] & 0x7F)

def _decode_text_frame(payload):
    """Einfache Decodierung eines ID3-Textframes."""
    if not payload:
        return ""
    enc = payload[0]
    data = payload[1:]
    try:
        if enc == 0:      # ISO-8859-1
            txt = data.split(b"\x00", 1)[0].decode("latin-1", "ignore")
        elif enc in (1, 2):  # UTF-16 / UTF-16BE
            # BOM entscheidet Endianess, für ignore reicht utf-16
            txt = data.split(b"\x00\x00", 1)[0].decode("utf-16", "ignore")
        elif enc == 3:    # UTF-8
            txt = data.split(b"\x00", 1)[0].decode("utf-8", "ignore")
        else:
            txt = data.decode("latin-1", "ignore")
    except Exception:
        txt = ""
    return txt.strip()

def _read_id3v2(path, max_bytes=16384): # 4096
    """
    Liest ID3v2.2 / 2.3 / 2.4 minimal (Titel, Album, Artist, Track).
    Unterstützte Frames:
      v2.2: TT2, TAL, TP1, TRK
      v2.3/2.4: TIT2, TALB, TPE1, TRCK
    """
    meta = {}
    try:
        with open(path, "rb") as f:
            header = f.read(10)
            if len(header) != 10 or header[0:3] != b"ID3":
                return meta
            
            version_major = header[3]   # 2, 3 oder 4
            # Tag-Größe ist "syncsafe"
            tag_size = _syncsafe_to_int(header[6:10])
            if tag_size <= 0:
                return meta
            
            to_read = min(tag_size, max_bytes)
            data = f.read(to_read)
    except Exception as e:
        if _DEBUG:
            print("[ID3] v2 read error:", e)
        return meta
    
    offset = 0
    length = len(data)
    
    # Wir wollen nur diese Felder
    wanted_23_24 = {
        b"TIT2": "title",
        b"TALB": "album",
        b"TPE1": "artist",
        b"TRCK": "track",
    }
    wanted_22 = {
        b"TT2": "title",
        b"TAL": "album",
        b"TP1": "artist",
        b"TRK": "track",
    }
    needed = set(["title", "album", "artist", "track"])
    
    # ---------- Fall 1: ID3v2.2 (3-Byte Frame-ID, 3-Byte Größe) ----------
    if version_major == 2:
        if _DEBUG:
            print("[ID3] v2.2 detected, parsing")
        
        while offset + 6 <= length and needed:
            frame_id = data[offset : offset + 3]
            frame_size = (data[offset + 3] << 16) | (data[offset + 4] << 8) | data[offset + 5]
            frame_start = offset + 6
            frame_end = frame_start + frame_size
            
            # Ende oder kaputtes Frame
            if frame_id == b"\x00\x00\x00" or frame_size <= 0 or frame_end > length:
                break
            
            if frame_id in wanted_22:
                key = wanted_22[frame_id]
                if key in needed:
                    payload = data[frame_start:frame_end]
                    txt = _decode_text_frame(payload)
                    if txt:
                        meta[key] = txt
                        needed.discard(key)
            
            offset = frame_end
        return meta
    
    # ---------- Fall 2: ID3v2.3 / 2.4 (4-Byte Frame-ID, 4-Byte Größe) ----------
    if _DEBUG:
        print("[ID3] v2.%d detected, parsing" % version_major)
    
    while offset + 10 <= length and needed:
        frame_id = data[offset : offset + 4]
        if frame_id == b"\x00\x00\x00\x00":
            break
        
        raw_size_bytes = data[offset + 4 : offset + 8]
        if version_major == 4:
            # v2.4 verwendet syncsafe frame sizes
            frame_size = _syncsafe_to_int(raw_size_bytes)
        else:
            # v2.3: normale 32-bit Big-Endian-Größe
            frame_size = int.from_bytes(raw_size_bytes, "big")
        
        frame_start = offset + 10
        frame_end = frame_start + frame_size
        
        if frame_size <= 0 or frame_end > length:
            break
        
        if frame_id in wanted_23_24:
            key = wanted_23_24[frame_id]
            if key in needed:
                payload = data[frame_start:frame_end]
                txt = _decode_text_frame(payload)
                if txt:
                    meta[key] = txt
                    needed.discard(key)
        
        offset = frame_end
    
    return meta

def _read_id3v1(path):
    """Liest ID3v1 am Dateiende."""
    meta = {}
    try:
        size = os.stat(path)[6]
        if size < 128:
            return meta
        with open(path, "rb") as f:
            f.seek(size - 128)
            tail = f.read(128)
    except Exception as e:
        if _DEBUG: print("[ID3] v1 read error:", e)
        return meta
    
    if len(tail) != 128 or tail[0:3] != b"TAG":
        return meta
    
    try:
        title  = tail[3:33].rstrip(b"\x00 ").decode("latin-1", "ignore")
        artist = tail[33:63].rstrip(b"\x00 ").decode("latin-1", "ignore")
        album  = tail[63:93].rstrip(b"\x00 ").decode("latin-1", "ignore")
        comment = tail[97:127]
        track = ""
        # ID3v1.1: letztes Byte ist Tracknummer, Byte 125 == 0
        if comment[28] == 0 and comment[29] != 0:
            track = str(comment[29])
    except Exception as e:
        if _DEBUG: print("[ID3] v1 decode error:", e)
        title = artist = album = ""
        track = ""
    
    if title:
        meta["title"] = title
    if album:
        meta["album"] = album
    if artist:
        meta["artist"] = artist
    if track:
        meta["track"] = track
    
    return meta

def read_id3(filepath):
    """
    Liefert Dict mit:
      title, album, artist, track
    plus Anzeige-Felder:
      display_album, display_title, display_author
    """
    base_meta = {"title": "", "album": "", "artist": "", "track": ""}
    
    v2 = _read_id3v2(filepath)
    v1 = _read_id3v1(filepath)
    
    meta = dict(base_meta)
    for k in base_meta:
        if k in v2 and v2[k]:
            meta[k] = v2[k]
        elif k in v1 and v1[k]:
            meta[k] = v1[k]
    
    title  = (meta.get("title")  or "").strip()
    album  = (meta.get("album")  or "").strip()
    artist = (meta.get("artist") or "").strip()
    track  = (meta.get("track")  or "").strip()
    
    # Tracknummer aus "4/16" extrahieren
    track_no = ""
    if track:
        track_no = track.split("/", 1)[0].strip()
    
    # Dateiname ohne Pfad/Extension – MicroPython hat kein os.path
    basename = filepath
    # Pfad abtrennen
    for sep in ("/", "\\"):
        i = basename.rfind(sep)
        if i >= 0:
            basename = basename[i + 1 :]
    # Extension abtrennen
    dot = basename.rfind(".")
    if dot > 0:
        filename_no_ext = basename[:dot]
    else:
        filename_no_ext = basename
    
    # Wenn keine Tracknummer im Tag: führende Ziffern aus Dateinamen
    if not track_no:
        tmp = ""
        for ch in filename_no_ext:
            if "0" <= ch <= "9":
                tmp += ch
            else:
                break
        if tmp:
            track_no = tmp
    
    # Anzeige-Felder
    display_album = album or artist or ""
    if title:
        display_title = title
    else:
        if track_no:
            display_title = "%s. %s" % (track_no, filename_no_ext)
        else:
            display_title = filename_no_ext
    
    display_author = artist or ""
    
    meta["title"] = title
    meta["album"] = album
    meta["artist"] = artist
    meta["track"] = track
    meta["display_album"] = display_album
    meta["display_title"] = display_title
    meta["display_author"] = display_author
    
    if _DEBUG: print("[ID3] meta for", filepath, "->", meta)
    
    return meta

