# id3.py
# Leichtgewichtiges ID3-Parsing für MicroPython (ID3v2.2/2.3/2.4 + Fallback ID3v1)
# Liest: Titel (TIT2/TT2), Album (TALB/TAL), Artist (TPE1/TP1), Track (TRCK/TRK)

import os
from config import _DEBUG_ID3 as _DEBUG

def _syncsafe_to_int(b):
    # 4 Bytes syncsafe -> int
    return ((b[0] & 0x7F) << 21) | ((b[1] & 0x7F) << 14) | ((b[2] & 0x7F) << 7) | (b[3] & 0x7F)

def _read_u32(b):
    # Big-endian 32-bit
    return (b[0]<<24) | (b[1]<<16) | (b[2]<<8) | b[3]

def _decode_text(enc_byte, raw):
    # enc_byte: 0=ISO-8859-1, 1=UTF-16 (BOM), 2=UTF-16BE, 3=UTF-8
    if not raw:
        return ""
    try:
        if enc_byte == 0:
            if _DEBUG: print("[ID3] trying latin-1 for ID3 Tags")
            return raw.decode('latin-1').strip('\x00').strip()
        elif enc_byte == 1:
            # UTF-16 mit BOM
            if _DEBUG: print("[ID3] trying UTF-16 with BOM for ID3 Tags")
            return raw.decode('utf-16').strip('\x00').strip()
        elif enc_byte == 2:
            # UTF-16 BE (ohne BOM)
            if _DEBUG: print("[ID3] trying UTF-16 wo BOM for ID3 Tags")
            return raw.decode('utf-16-be').strip('\x00').strip()
        elif enc_byte == 3:
            if _DEBUG: print("[ID3] trying UTF-8 for ID3 Tags")
            return raw.decode('utf-8').strip('\x00').strip()
    except Exception as e:
        if _DEBUG: print("[ID3] No suitable enc-byte found falling back to latin-1 ")
        # Fallback
        try:
            return raw.decode('latin-1').strip('\x00').strip()
        except Exception as e:
            if _DEBUG: print("[ID3] Exception during decoding of ID3 Tags " + str(e))
            return ""
    return ""

def _parse_id3v2(f):
    if _DEBUG: print("[ID3] parsing ID3V2 Tags")
    # Erwartet: Dateizeiger steht am Anfang der Datei.
    header = f.read(10)
    if len(header) < 10 or header[0:3] != b'ID3':
        return None  # kein ID3v2
    ver = header[3]  # 2,3,4
    flags = header[5]
    size = _syncsafe_to_int(header[6:10])

    # Optionale Extended Header in v2.3/2.4
    read_bytes = 0
    if ver in (3,4) and (flags & 0x40):  # Extended header present
        # v2.3: 4-Byte Größe (nicht syncsafe), v2.4: syncsafe
        ext_header = f.read(4)
        if len(ext_header) < 4:
            return None
        if ver == 4:
            ext_size = _syncsafe_to_int(ext_header)
        else:
            ext_size = _read_u32(ext_header)
        f.read(ext_size)  # skip ext header rest
        read_bytes += 4 + ext_size

    frames = {}
    # Wir scannen maximal "size" Bytes, aber brechen vorher ab, wenn nichts mehr plausibel ist.
    while read_bytes < size:
        if ver == 2:
            hdr = f.read(6)
            if len(hdr) < 6:
                break
            frame_id = hdr[0:3].decode('latin-1')
            frame_size = (hdr[3]<<16) | (hdr[4]<<8) | hdr[5]
            frame_flags = 0
            read_bytes += 6
        else:
            hdr = f.read(10)
            if len(hdr) < 10:
                break
            frame_id = hdr[0:4].decode('latin-1')
            # In v2.4 sind Größen syncsafe, in v2.3 normale 32-bit
            if ver == 4:
                frame_size = _syncsafe_to_int(hdr[4:8])
            else:
                frame_size = _read_u32(hdr[4:8])
            frame_flags = (hdr[8]<<8) | hdr[9]
            read_bytes += 10

        # Leerer Frame/Ende
        if frame_size == 0 or (ver != 2 and (not frame_id.strip() or frame_id[0] == '\x00')):
            break

        # Nur Textframes interessieren
        if (ver == 2 and frame_id in ('TT2','TAL','TP1','TRK')) or \
           (ver in (3,4) and frame_id in ('TIT2','TALB','TPE1','TRCK')):
            content = f.read(frame_size)
            read_bytes += frame_size
            if not content:
                continue
            enc = content[0] if len(content) > 0 else 0
            text = _decode_text(enc, content[1:])
            if ver == 2:
                if frame_id == 'TT2': frames['title']  = text
                elif frame_id == 'TAL': frames['album']  = text
                elif frame_id == 'TP1': frames['artist'] = text
                elif frame_id == 'TRK': frames['track']  = text
            else:
                if frame_id == 'TIT2': frames['title']  = text
                elif frame_id == 'TALB': frames['album']  = text
                elif frame_id == 'TPE1': frames['artist'] = text
                elif frame_id == 'TRCK': frames['track']  = text
        else:
            # uninteressanter Frame: überspringen
            f.seek(frame_size, 1)
            read_bytes += frame_size

        # Sicherheitsbreak bei übergroßen/kaputten Tags
        if read_bytes > size:
            break
    
    return frames

def _parse_id3v1(f, filesize):
    if _DEBUG: print("[ID3] parsing ID3V1 Tags")
    # Letzte 128 Bytes
    if filesize < 128:
        return {}
    try:
        f.seek(filesize - 128)
        data = f.read(128)
        if len(data) == 128 and data[0:3] == b'TAG':
            title = data[3:33].rstrip(b'\x00').decode('latin-1', 'ignore').strip()
            artist= data[33:63].rstrip(b'\x00').decode('latin-1', 'ignore').strip()
            album = data[63:93].rstrip(b'\x00').decode('latin-1', 'ignore').strip()
            track = ""
            # ID3v1.1: Byte 125 = 0, Byte 126 = Tracknummer
            if data[125] == 0 and data[126] != 0:
                track = str(data[126])
            
            tags = {'title': title, 'artist': artist, 'album': album, 'track': track}
            return tags
    except:
        pass
    return {}

def read_id3(filepath):
    """
    Liefert ein Dict mit Schlüsseln:
      title, album, artist, track
    plus Anzeige-Felder:
      display_album, display_title, display_author
    """
    meta = {'title': '', 'album': '', 'artist': '', 'track': ''}
    try:
        sz = os.stat(filepath)[6]
        with open(filepath, 'rb') as f:
            # v2 vorne
            v2 = _parse_id3v2(f)
            if v2:
                for k in meta:
                    if k in v2 and v2[k]:
                        meta[k] = v2[k]
            # v1 fallback (füllt nur noch leere Felder)
            v1 = _parse_id3v1(f, sz)
            if v1:
                for k in meta:
                    if (not meta[k]) and (k in v1) and v1[k]:
                        meta[k] = v1[k]
    except Exception as e:
        if _DEBUG:
            print("[ID3] error reading {}:".format(filepath), e)
    
    # ------- Fallbacks & Anzeige-Felder -------
    
    title  = (meta.get('title')  or "").strip()
    album  = (meta.get('album')  or "").strip()
    artist = (meta.get('artist') or "").strip()
    track  = (meta.get('track')  or "").strip()
    
    # Tracknummer aus TRCK ("4/16") o.ä. extrahieren
    track_no = ""
    if track:
        track_no = track.split("/")[0].strip()
    
    # Dateiname ohne Pfad und Extension
    basename = os.path.basename(filepath)
    filename_no_ext = basename.rsplit(".", 1)[0]
    
    # Wenn noch keine Tracknummer vorhanden ist, führende Ziffern aus dem Dateinamen nehmen
    if not track_no:
        tmp = ""
        for ch in filename_no_ext:
            if ch.isdigit():
                tmp += ch
            else:
                break
        if tmp:
            track_no = tmp
    
    # display_album: bevorzugt Album, sonst Artist
    display_album = album or artist or ""
    
    # display_title: bevorzugt Titel, sonst "TrackNum. Dateiname"
    if title:
        display_title = title
    else:
        if track_no:
            display_title = "{}. {}".format(track_no, filename_no_ext)
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
    if _DEBUG: print("[ID3] Tags found " + str(meta))
    return meta


