# net/http_server.py
#
# Nicht-blockierender HTTP-Server für Pico (alles in dieser Datei):
# - Upload (multipart/form-data) nur wenn allowed_uid gesetzt ist
# - Browse/Delete mit Whitelist-Roots & Safe-Path
# - RTC: /time (GET/POST)
# - Album-Ansicht: /album?uid=<UID> (oder default allowed_uid)
#
# Optimiert:
# - Listener+Client non-blocking
# - Upload streaming: keine komplette Body-Pufferung im RAM
# - SD writes in 512B chunks
# - Upload Progress (ohne JS, optional auto-refresh)
#
import socket, ure, os

from config import (
    UPLOAD_PORT,
    AUDIO_ROOT,
    STATE_DIR,
    _DEBUG_WEB as _DEBUG,
)

# optional: ID3 Pre-Parsing -> metadata.json
try:
    import id3 as _id3
except Exception:
    _id3 = None

# ---------- HTML ----------
_HTML_HEAD = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nConnection: close\r\n\r\n"
_HTML = """<html><head><meta charset="utf-8"><title>Audio Uploader</title>
{extra_head}
<style>
body{{font-family:sans-serif}}
input,button{{font-size:16px;margin:4px}}
code{{background:#eee;padding:2px 4px;border-radius:3px}}
small{{color:#666}}
table{{border-collapse:collapse}}
td,th{{border:1px solid #ddd;padding:6px 10px}}
</style></head><body>
<h2>Audio Uploader</h2>
<p>
<a href="/">Home</a> ·
<a href="/upload">Upload</a> ·
<a href="/album">Album</a> ·
<a href="/browse?path=/">Browse</a> ·
<a href="/time">RTC</a>
</p>
{content}
</body></html>"""

_FORM = """<p>Ziel-UID: <b>{uid}</b></p>
<form method="POST" action="/upload" enctype="multipart/form-data">
<input type="file" name="file" multiple required><br>
<button type="submit">Upload nach /{uid}</button>
</form>
"""

# ---------- tuning ----------
_RECV_MAX_PER_POLL = 2048
_BODY_FEED_CHUNK = 2048
_SD_WRITE_CHUNK = 512

_ENABLE_METADATA_JSON = True     # wenn id3.py verfügbar -> metadata.json erzeugen
_ENABLE_UPLOAD_AUTOREFRESH = True
_UPLOAD_AUTOREFRESH_SEC = 2

# Delete-Schutz: standardmäßig NUR im AUDIO_ROOT löschen (sehr empfohlen)
_DELETE_ONLY_AUDIO_ROOT = True

# Browse-Schutz: welche Root-Verzeichnisse sind erlaubt?
# "/" erlauben ist praktisch fürs Debugging, aber auch riskanter -> kannst du rausnehmen.
_BROWSE_ALLOWED_ROOTS = ("/", AUDIO_ROOT, STATE_DIR)


# ---------- helpers ----------
def _send(cl, data):
    try:
        if isinstance(data, str):
            data = data.encode()
        cl.send(data)
    except Exception:
        pass


def _ok(cl, html, extra_head=""):
    _send(cl, _HTML_HEAD + _HTML.format(content=html, extra_head=extra_head))


def _bad(cl, code=400, msg="Bad Request"):
    try:
        cl.send("HTTP/1.1 {} {}\r\nConnection: close\r\n\r\n{}".format(code, "Bad", msg))
    except Exception:
        pass


def _notfound(cl):
    _bad(cl, 404, "Not found")


def _safe_basename(name: str) -> str:
    if not name:
        return ""
    name = name.replace("\\", "/").split("/")[-1]
    out = []
    for ch in name:
        o = ord(ch)
        if (48 <= o <= 57) or (65 <= o <= 90) or (97 <= o <= 122) or ch in "._- ":
            out.append(ch)
    return ("".join(out).strip()) or "file.bin"


def _parse_qs(path: str):
    qs = {}
    route = path
    if "?" in path:
        route, query = path.split("?", 1)
        for kv in query.split("&"):
            if "=" in kv:
                k, v = kv.split("=", 1)
                qs[k] = v
            elif kv:
                qs[kv] = ""
    return route, qs


def _is_dir_stat(st):
    try:
        return (st[0] & 0x4000) != 0
    except Exception:
        return False


def _ensure_dir(p: str):
    if not p or p == "/":
        return
    segs = [x for x in p.split("/") if x]
    cur = ""
    for s in segs:
        cur = cur + "/" + s
        try:
            os.mkdir(cur)
        except OSError:
            pass


def _album_dir(uid: str) -> str:
    return AUDIO_ROOT.rstrip("/") + "/" + uid


def _path_normalize(p: str) -> str:
    """
    Very small "normalize": remove trailing spaces, ensure startswith /,
    collapse //, remove /./ segments.
    """
    if p is None:
        return "/"
    p = p.strip()
    if not p.startswith("/"):
        p = "/" + p
    while "//" in p:
        p = p.replace("//", "/")
    # remove /./
    p = p.replace("/./", "/")
    if p != "/" and p.endswith("/"):
        p = p[:-1]
    return p


def _is_under_root(p: str, root: str) -> bool:
    p = _path_normalize(p)
    root = _path_normalize(root)
    if root == "/":
        return p.startswith("/")
    if p == root:
        return True
    return p.startswith(root.rstrip("/") + "/")


def _browse_allowed(p: str) -> bool:
    p = _path_normalize(p)
    for r in _BROWSE_ALLOWED_ROOTS:
        if _is_under_root(p, r):
            return True
    return False


def _delete_allowed(p: str) -> bool:
    p = _path_normalize(p)
    # never delete root or state dir root
    if p in ("/", _path_normalize(STATE_DIR)):
        return False
    if _DELETE_ONLY_AUDIO_ROOT:
        return _is_under_root(p, AUDIO_ROOT)
    # otherwise: allow deletes only in browse roots
    return _browse_allowed(p)


def _read_json(path: str, default):
    try:
        import json
        with open(path, "r") as f:
            return json.load(f)
    except Exception:
        return default


def _write_json(path: str, obj) -> bool:
    try:
        import json
        with open(path, "w") as f:
            json.dump(obj, f)
        return True
    except Exception:
        return False


def _list_audio_tracks(d: str):
    """
    List mp3/wav in a directory, RAM-schonend wenn ilistdir vorhanden.
    """
    tracks = []
    try:
        if hasattr(os, "ilistdir"):
            for e in os.ilistdir(d):
                name = e[0]
                if not name or name.startswith("."):
                    continue
                low = name.lower()
                if low.endswith(".mp3") or low.endswith(".wav"):
                    tracks.append(name)
        else:
            for name in os.listdir(d):
                if not name or name.startswith("."):
                    continue
                low = name.lower()
                if low.endswith(".mp3") or low.endswith(".wav"):
                    tracks.append(name)
    except Exception:
        return []
    tracks.sort()
    return tracks


def _write_album_index(uid: str):
    d = _album_dir(uid)
    try:
        os.stat(d)
    except Exception:
        return
    tracks = _list_audio_tracks(d)
    _write_json(d.rstrip("/") + "/.idx.json", {"tracks": tracks})


def _write_metadata_json(uid: str):
    if not _ENABLE_METADATA_JSON or _id3 is None:
        return
    d = _album_dir(uid)
    try:
        os.stat(d)
    except Exception:
        return

    idx_path = d.rstrip("/") + "/.idx.json"
    obj = _read_json(idx_path, {})
    tracks = obj.get("tracks", None)
    if not tracks:
        tracks = _list_audio_tracks(d)

    meta = {}
    for fn in tracks:
        p = d.rstrip("/") + "/" + fn
        try:
            m = _id3.read_id3(p)
            if isinstance(m, dict):
                meta[fn] = m
        except Exception:
            pass

    _write_json(d.rstrip("/") + "/metadata.json", meta)


# ---------- streaming multipart parser ----------
class _MultipartStream:
    """
    Minimal multipart/form-data streaming parser.
    Writes file parts directly to SD (512B chunks).
    Also updates progress attributes for UI.
    """
    def __init__(self, boundary: bytes, uid: str, total_len: int):
        self.boundary = b"--" + boundary
        self.boundary_end = self.boundary + b"--"

        self.uid = uid
        self.total_len = total_len

        self.buf = b""
        self.state = "preamble"

        self.cur_headers = {}
        self.cur_fname = None
        self.cur_fp = None
        self.saved = 0

        # progress
        self.bytes_in = 0
        self.cur_written = 0
        self.last_saved_name = None

        self._keep = max(128, len(self.boundary) + 16)

    def _open_file(self, fname: str):
        d = _album_dir(self.uid)
        _ensure_dir(d)
        safe = _safe_basename(fname)
        path = d.rstrip("/") + "/" + safe
        self.cur_fp = open(path, "wb")
        self.cur_written = 0
        self.cur_fname = safe
        if _DEBUG:
            print("[HTTP] upload ->", path)

    def _close_file(self):
        if self.cur_fp:
            try:
                self.cur_fp.close()
            except Exception:
                pass
        if self.cur_fname:
            self.last_saved_name = self.cur_fname
        self.cur_fp = None
        self.cur_fname = None
        self.cur_headers = {}

    def _parse_part_headers(self, hb: bytes):
        hdrs = {}
        for line in hb.split(b"\r\n"):
            if b":" in line:
                k, v = line.split(b":", 1)
                hdrs[k.strip().lower()] = v.strip()
        return hdrs

    def _extract_filename(self, hdrs: dict):
        cd = hdrs.get(b"content-disposition", b"")
        try:
            cd_s = cd.decode()
        except Exception:
            cd_s = ""
        m = ure.search('filename="([^"]+)"', cd_s)
        return m.group(1) if m else None

    def _write_sd(self, b: bytes):
        if not self.cur_fp or not b:
            return
        off = 0
        while off < len(b):
            chunk = b[off:off + _SD_WRITE_CHUNK]
            self.cur_fp.write(chunk)
            off += _SD_WRITE_CHUNK
            self.cur_written += len(chunk)

    def feed(self, data: bytes):
        if not data:
            return
        self.bytes_in += len(data)
        self.buf += data

        while True:
            if self.state == "preamble":
                i = self.buf.find(self.boundary)
                if i == -1:
                    self.buf = self.buf[-self._keep:]
                    return
                self.buf = self.buf[i + len(self.boundary):]
                if self.buf.startswith(b"\r\n"):
                    self.buf = self.buf[2:]
                self.state = "part_headers"
                continue

            if self.state == "part_headers":
                j = self.buf.find(b"\r\n\r\n")
                if j == -1:
                    if len(self.buf) > 4096:
                        self.buf = self.buf[-4096:]
                    return
                header_block = self.buf[:j]
                self.buf = self.buf[j + 4:]
                self.cur_headers = self._parse_part_headers(header_block)
                fname = self._extract_filename(self.cur_headers)
                if fname:
                    self._open_file(fname)
                self.state = "part_data"
                continue

            if self.state == "part_data":
                marker = b"\r\n" + self.boundary
                marker_end = b"\r\n" + self.boundary_end
                k = self.buf.find(marker)
                kend = self.buf.find(marker_end)

                if k == -1 and kend == -1:
                    if self.cur_fp and len(self.buf) > self._keep:
                        cut = len(self.buf) - self._keep
                        self._write_sd(self.buf[:cut])
                        self.buf = self.buf[cut:]
                    else:
                        if len(self.buf) > self._keep:
                            self.buf = self.buf[-self._keep:]
                    return

                if k == -1:
                    bpos = kend
                    is_end = True
                elif kend == -1:
                    bpos = k
                    is_end = False
                else:
                    bpos = k if k < kend else kend
                    is_end = (bpos == kend)

                part_data = self.buf[:bpos]
                self._write_sd(part_data)

                self.buf = self.buf[bpos + 2:]  # drop \r\n
                if is_end and self.buf.startswith(self.boundary_end):
                    self.buf = self.buf[len(self.boundary_end):]
                    if self.buf.startswith(b"\r\n"):
                        self.buf = self.buf[2:]
                    if self.cur_fp:
                        self._close_file()
                        self.saved += 1
                    self.state = "done"
                    return

                if self.buf.startswith(self.boundary):
                    self.buf = self.buf[len(self.boundary):]
                    if self.buf.startswith(b"\r\n"):
                        self.buf = self.buf[2:]
                    if self.cur_fp:
                        self._close_file()
                        self.saved += 1
                    self.state = "part_headers"
                    continue

                self.buf = self.buf[-self._keep:]
                return

            if self.state == "done":
                return


# ---------- HttpServer ----------
class HttpServer:
    def __init__(self, rtc=None):
        self.addr = None
        self.s = None
        self.allowed_uid = None
        self._listening = False
        self.rtc = rtc

        # single active client state
        self._cl = None
        self._cl_addr = None
        self._rx = b""
        self._headers_parsed = False

        self._method = None
        self._path = None
        self._route = None
        self._qs = None
        self._hdrs = {}

        self._content_len = 0
        self._body_read = 0

        self._mode = "idle"  # idle | time_post | upload_post | done
        self._mp = None
        self._upload_err = None

        # upload status for UI
        self._upload_active = False
        self._upload_uid = None

    # ------ RTC-Zugriff von außen setzen ------
    def set_rtc(self, rtc):
        self.rtc = rtc

    # --- Lifecycle ---
    def start(self, ip="0.0.0.0"):
        try:
            if self.s:
                self.stop()
            self.s = socket.socket()
            self.s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.s.bind((ip, UPLOAD_PORT))
            self.s.listen(1)
            try:
                self.s.setblocking(False)
            except Exception:
                self.s.settimeout(0)
            self.addr = (ip, UPLOAD_PORT)
            self._listening = True
            if _DEBUG:
                print("[HTTP] listening on {}:{}".format(ip, UPLOAD_PORT))
            return True
        except Exception as e:
            if _DEBUG:
                print("[HTTP] start fail:", e)
            self.s = None
            self._listening = False
            return False

    def stop(self):
        self._close_client()
        try:
            if self.s:
                self.s.close()
        except Exception:
            pass
        self.s = None
        self._listening = False
        if _DEBUG:
            print("[HTTP] stopped")

    # --- Arming (aktivieren/deaktivieren) ---
    def arm(self, uid, ip="0.0.0.0"):
        if not self._listening:
            self.start(ip)
        if uid and uid != self.allowed_uid:
            self.allowed_uid = uid
            if _DEBUG:
                print("[HTTP] armed for UID", uid)

    def disarm(self):
        if self.allowed_uid is not None:
            if _DEBUG:
                print("[HTTP] disarmed (UID {})".format(self.allowed_uid))
        self.allowed_uid = None
        if self._listening:
            self.stop()

    # ---------- RTC /time ----------
    def _rtc_current_strings(self):
        if not self.rtc:
            return None, None
        try:
            y, m, d, wd, hh, mm, ss = self.rtc.now()
            date_str = "{:04d}-{:02d}-{:02d}".format(y, m, d)
            time_str = "{:02d}:{:02d}:{:02d}".format(hh, mm, ss)
            return date_str, time_str
        except Exception as e:
            if _DEBUG:
                print("[HTTP] rtc.now() failed:", e)
            return None, None

    def _parse_form_body(self, body):
        res = {}
        try:
            txt = body.decode()
        except Exception:
            return res
        for part in txt.split("&"):
            if "=" in part:
                k, v = part.split("=", 1)
                res[k] = v
        return res

    def _time_render(self, cl, msg=""):
        cur_date, cur_time = self._rtc_current_strings()
        if not cur_date:
            cur_html = "<p><b>Hinweis:</b> Keine RTC verf&uuml;gbar.</p>"
        else:
            cur_html = "<p>Aktuelle RTC-Zeit: <code>{} {}</code></p>".format(cur_date, cur_time)

        form_html = """
<h3>RTC-Uhr stellen</h3>
{msg}
{cur}
<form method="POST" action="/time">
<p>Datum (YYYY-MM-DD): <input name="date" value="{d}" required></p>
<p>Uhrzeit (HH:MM:SS): <input name="time" value="{t}" required></p>
<button type="submit">Uhr stellen</button>
</form>
""".format(msg=msg, cur=cur_html, d=cur_date or "", t=cur_time or "")
        _ok(cl, form_html)

    # ---------- Pages ----------
    def _home(self, cl):
        if self.allowed_uid:
            html = (
                "<p><b>Upload aktiv</b> f&uuml;r UID <code>{uid}</code>.</p>"
                "<p><a href='/upload'>Dateien f&uuml;r dieses Tag hochladen</a></p>"
                "<p><a href='/album?uid={uid}'>Album ansehen</a></p>"
            ).format(uid=self.allowed_uid)
        else:
            html = (
                "<p><b>Kein NFC-Tag aktiv.</b> "
                "Upload ist erst m&ouml;glich, wenn im Prog-Modus ein Tag aufgelegt wird.</p>"
            )
        html += "<p><a href='/time'>RTC-Uhr stellen</a></p>"
        html += "<p><a href='/browse?path=/'>Dateien durchsuchen</a></p>"
        _ok(cl, html)

    def _upload_get(self, cl):
        if not self.allowed_uid:
            _bad(cl, 403, "Upload deaktiviert (Prog/Tag erforderlich)")
            return

        extra = ""
        refresh = ""
        if self._upload_active and self._upload_uid == self.allowed_uid and self._mp:
            # progress info
            total = self._mp.total_len or 0
            cur = self._mp.bytes_in or 0
            pct = int((cur * 100) // total) if total > 0 else 0
            fname = self._mp.cur_fname or self._mp.last_saved_name or ""
            extra = (
                "<div style='padding:10px;border:1px solid #ddd;margin:10px 0;'>"
                "<p><b>Upload l&auml;uft...</b></p>"
                "<p>Datei: <code>{fn}</code></p>"
                "<p>{cur} / {tot} Bytes ({pct}%)</p>"
                "<p><small>Diese Seite aktualisiert sich automatisch.</small></p>"
                "</div>"
            ).format(fn=fname, cur=cur, tot=total, pct=pct)
            if _ENABLE_UPLOAD_AUTOREFRESH:
                refresh = "<meta http-equiv='refresh' content='{}'>".format(_UPLOAD_AUTOREFRESH_SEC)

        _ok(cl, "<h3>Upload</h3>" + extra + _FORM.format(uid=self.allowed_uid), extra_head=refresh)

    def _delete(self, cl, qs):
        path = _path_normalize(qs.get("path", ""))
        if not path or not _delete_allowed(path):
            _bad(cl, 400, "unsafe delete")
            return
        try:
            os.remove(path)
            _ok(cl, "<p>Deleted: {}</p><p><a href='/browse?path={}'>Browse</a></p>".format(path, os.path.dirname(path) or "/"))
        except Exception as e:
            _bad(cl, 500, "delete fail: {}".format(e))

    def _browse(self, cl, qs):
        path = _path_normalize(qs.get("path", "/"))
        if not _browse_allowed(path):
            _bad(cl, 403, "browse forbidden")
            return

        try:
            os.stat(path)
        except Exception:
            _notfound(cl)
            return

        html = ["<h3>Browse: {}</h3><ul>".format(path)]
        if path != "/":
            parent = "/" + "/".join([p for p in path.split("/") if p][:-1])
            if parent == "":
                parent = "/"
            html.append("<li><a href='/browse?path={}'>..</a></li>".format(parent))

        try:
            names = []
            if hasattr(os, "ilistdir"):
                for e in os.ilistdir(path):
                    n = e[0]
                    if n:
                        names.append(n)
            else:
                names = os.listdir(path)
            names.sort()

            for it in names:
                p = (path.rstrip("/") + "/" + it) if path != "/" else ("/" + it)
                try:
                    st = os.stat(p)
                    is_dir = _is_dir_stat(st)
                except Exception:
                    is_dir = False

                if is_dir:
                    html.append("<li>[DIR] <a href='/browse?path={p}'>{i}</a></li>".format(p=p, i=it))
                else:
                    del_link = ""
                    if _delete_allowed(p):
                        del_link = " <a href='/delete?path={p}' onclick='return confirm(\"Delete?\")'>[del]</a>".format(p=p)
                    html.append("<li>{i}{d}</li>".format(i=it, d=del_link))
        except Exception as e:
            _bad(cl, 500, "browse fail: {}".format(e))
            return

        html.append("</ul>")
        _ok(cl, "".join(html))

    def _album(self, cl, qs):
        uid = qs.get("uid") or self.allowed_uid
        if not uid:
            _ok(cl, "<p><b>Kein UID aktiv.</b> Nutze <code>/album?uid=&lt;UID&gt;</code> oder lege im Prog-Mode ein Tag auf.</p>")
            return

        d = _album_dir(uid)
        if not _browse_allowed(d):
            _bad(cl, 403, "album forbidden")
            return

        try:
            os.stat(d)
        except Exception:
            _ok(cl, "<p>Album nicht gefunden: <code>{}</code></p>".format(d))
            return

        idx = _read_json(d.rstrip("/") + "/.idx.json", {})
        tracks = idx.get("tracks", None)
        if not tracks:
            tracks = _list_audio_tracks(d)

        meta = _read_json(d.rstrip("/") + "/metadata.json", {})

        rows = []
        for fn in tracks:
            m = meta.get(fn, {}) if isinstance(meta, dict) else {}
            title = m.get("title", "") if isinstance(m, dict) else ""
            artist = m.get("artist", "") if isinstance(m, dict) else ""
            trackno = m.get("track", "") if isinstance(m, dict) else ""
            p = d.rstrip("/") + "/" + fn
            del_link = ""
            if _delete_allowed(p):
                del_link = "<a href='/delete?path={}' onclick='return confirm(\"Delete?\")'>del</a>".format(p)
            rows.append("<tr><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{}</td></tr>".format(
                trackno, fn, title, artist, del_link
            ))

        html = []
        html.append("<h3>Album: <code>{}</code></h3>".format(uid))
        html.append("<p>Pfad: <code>{}</code></p>".format(d))
        html.append("<p><a href='/browse?path={}'>&raquo; Ordner browse</a></p>".format(d))
        html.append("<p><a href='/album?uid={}'>&#8635; refresh</a></p>".format(uid))
        html.append("<p><small>metadata.json {} | .idx.json {}</small></p>".format(
            "vorhanden" if isinstance(meta, dict) and meta else "nicht vorhanden",
            "vorhanden" if isinstance(idx, dict) and idx else "nicht vorhanden",
        ))
        html.append("<table><tr><th>#</th><th>Datei</th><th>Titel</th><th>Artist</th><th></th></tr>")
        html.append("".join(rows) if rows else "<tr><td colspan='5'>(keine Tracks)</td></tr>")
        html.append("</table>")
        _ok(cl, "".join(html))

    # ---------- client state machine ----------
    def _reset_client_state(self):
        self._rx = b""
        self._headers_parsed = False
        self._method = None
        self._path = None
        self._route = None
        self._qs = None
        self._hdrs = {}
        self._content_len = 0
        self._body_read = 0
        self._mode = "idle"
        self._mp = None
        self._upload_err = None

    def _close_client(self):
        if self._cl:
            try:
                self._cl.close()
            except Exception:
                pass
        self._cl = None
        self._cl_addr = None
        # if upload finished/aborted, clear upload active if this was the client
        if self._mode == "upload_post":
            self._upload_active = False
            self._upload_uid = None
        self._reset_client_state()

    def _accept_if_possible(self):
        if not self.s or not self._listening or self._cl:
            return
        try:
            cl, addr = self.s.accept()
        except OSError:
            return
        self._cl = cl
        self._cl_addr = addr
        try:
            cl.setblocking(False)
        except Exception:
            cl.settimeout(0)
        self._reset_client_state()
        if _DEBUG:
            print("[HTTP] connection from", addr)

    def _recv_some(self):
        if not self._cl:
            return
        got = 0
        while got < _RECV_MAX_PER_POLL:
            try:
                chunk = self._cl.recv(1024)
                if not chunk:
                    return
                self._rx += chunk
                got += len(chunk)
            except OSError:
                return

    def _try_parse_headers(self):
        if self._headers_parsed:
            return True
        sep = self._rx.find(b"\r\n\r\n")
        if sep == -1:
            return False
        head = self._rx[:sep]
        self._rx = self._rx[sep + 4:]

        lines = head.split(b"\r\n")
        if not lines:
            return False
        reqline = lines[0].decode()
        try:
            method, path, _ = reqline.split(" ", 2)
        except Exception:
            return False

        hdrs = {}
        for ln in lines[1:]:
            if b":" in ln:
                k, v = ln.split(b":", 1)
                hdrs[k.strip().lower().decode()] = v.strip().decode()

        self._method = method
        self._path = path
        self._route, self._qs = _parse_qs(path)
        self._hdrs = hdrs
        try:
            self._content_len = int(hdrs.get("content-length", "0") or "0")
        except Exception:
            self._content_len = 0

        self._headers_parsed = True
        if _DEBUG:
            print("[HTTP] request {} {}".format(self._method, self._route))
        return True

    def _start_route(self):
        cl = self._cl
        method = self._method
        route = self._route
        qs = self._qs or {}

        if method == "GET" and route == "/":
            self._home(cl)
            self._mode = "done"
            return

        if method == "GET" and route == "/upload":
            self._upload_get(cl)
            self._mode = "done"
            return

        if method == "GET" and route == "/browse":
            self._browse(cl, qs)
            self._mode = "done"
            return

        if method == "GET" and route == "/delete":
            self._delete(cl, qs)
            self._mode = "done"
            return

        if method == "GET" and route == "/album":
            self._album(cl, qs)
            self._mode = "done"
            return

        if route == "/time":
            if method == "GET":
                self._time_render(cl)
                self._mode = "done"
                return
            if method == "POST":
                self._mode = "time_post"
                return

        if method == "POST" and route == "/upload":
            if not self.allowed_uid:
                _bad(cl, 403, "Upload deaktiviert (Prog/Tag erforderlich)")
                self._mode = "done"
                return

            ctype = (self._hdrs.get("content-type", "") or "").lower()
            if "multipart/form-data" not in ctype or "boundary=" not in ctype:
                _bad(cl, 400, "multipart/form-data erforderlich")
                self._mode = "done"
                return

            boundary = ctype.split("boundary=")[1].strip()
            if boundary.startswith('"') and boundary.endswith('"'):
                boundary = boundary[1:-1]

            self._mp = _MultipartStream(boundary.encode(), self.allowed_uid, self._content_len)
            self._mode = "upload_post"
            self._upload_active = True
            self._upload_uid = self.allowed_uid
            return

        _notfound(cl)
        self._mode = "done"

    def _handle_time_post(self):
        if self._content_len <= 0:
            self._time_render(self._cl, "<p><b>Fehler:</b> Kein Body.</p>")
            self._mode = "done"
            return

        if len(self._rx) < self._content_len:
            return

        body = self._rx[:self._content_len]
        msg = ""
        form = self
