# net/http_server.py
#
# Kleiner, nicht-blockierender HTTP-Server für:
# - Upload von Dateien zu einem aktiven NFC-Tag (allowed_uid)
# - Browsen / Löschen im Dateisystem
# - Stellen der RTC-Uhr (/time)
#
# Wichtig:
# - Upload ist NUR erlaubt, wenn allowed_uid gesetzt ist.
# - /time funktioniert immer, sobald der Server läuft – unabhängig vom Tag.
#
import socket, ure, os
from config import (
                    UPLOAD_PORT,
                    AUDIO_ROOT,
                    STATE_DIR,
                    _DEBUG_WEB as _DEBUG
                    )
from storage import save_file_for_uid


_HTML_HEAD = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nConnection: close\r\n\r\n"
_HTML = """<html><head><meta charset="utf-8"><title>Audio Uploader</title>
<style>
body{{font-family:sans-serif}}
input,button{{font-size:16px;margin:4px}}
code{{background:#eee;padding:2px 4px;border-radius:3px}}
</style></head><body>
<h2>Audio Uploader</h2>
<p><a href="/">Home</a> · <a href="/upload">Upload</a> · <a href="/browse?path=/">Browse</a> · <a href="/time">RTC</a></p>
{content}</body></html>"""

_FORM = """<p>Ziel-UID: <b>{uid}</b></p>
<form method="POST" action="/upload" enctype="multipart/form-data">
<input type="file" name="file" multiple required><br>
<button type="submit">Upload nach /{uid}</button>
</form>
"""

class HttpServer:
    def __init__(self, rtc=None):
        self.addr = None
        self.s = None
        self.allowed_uid = None  # aktive UID für Upload (oder None)
        self._listening = False
        self.rtc = rtc
    
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
            self.s.settimeout(0)  # non-blocking accept
            self.addr = (ip, UPLOAD_PORT)
            self._listening = True
            if _DEBUG: print("[HTTP] listening on {}:{}".format(ip, UPLOAD_PORT))
            return True
        except Exception as e:
            if _DEBUG: print("[HTTP] start fail:", e)
            self.s = None
            self._listening = False
            return False
    
    def stop(self):
        try:
            if self.s:
                self.s.close()
        except Exception:
            pass
        self.s = None
        self._listening = False
        if _DEBUG: print("[HTTP] stopped")
    
    # --- Arming (aktivieren/deaktivieren) ---
    def arm(self, uid, ip="0.0.0.0"):
        """
        Aktiviert Upload exklusiv für diese UID.
        - uid == None: nur Server starten, Upload bleibt deaktiviert.
        - uid != None: allowed_uid setzen und Server bei Bedarf starten.
        """
        if not self._listening:
            self.start(ip)
        if uid and uid != self.allowed_uid:
            self.allowed_uid = uid
            if _DEBUG: print("[HTTP] armed for UID", uid)
    
    def disarm(self):
        """Deaktiviert Upload und stoppt den Listener."""
        if self.allowed_uid is not None:
            if _DEBUG: print("[HTTP] disarmed (UID {})".format(self.allowed_uid))
        self.allowed_uid = None
        if self._listening:
            self.stop()
    
    # --- Helpers / Responses ---
    def _send(self, cl, s):
        try:
            cl.send(s)
        except Exception:
            pass
    
    def _ok(self, cl, html):
        self._send(cl, _HTML_HEAD + _HTML.format(content=html))
    
    def _bad(self, cl, code=400, msg="Bad Request"):
        try:
            cl.send("HTTP/1.1 {} {}\r\nConnection: close\r\n\r\n{}".format(code, "Bad", msg))
        except Exception:
            pass
    
    def _notfound(self, cl):
        self._bad(cl, 404, "Not found")
    
    def _parse_qs(self, path):
        # path: string wie "/browse?path=/foo"
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
    
    # --- fs operationen --
    def _ensure_dir(self, p):
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
    
    def _delete(self, cl, qs):
        path = qs.get("path")
        if not path or path in ("/", STATE_DIR):
            self._bad(cl, 400, "unsafe")
            return
        try:
            os.remove(path)
            self._ok(
                cl,
                "<p>Deleted: {}</p><p><a href='/browse?path=/'>Browse</a></p>".format(
                    path
                ),
            )
        except Exception as e:
            self._bad(cl, 500, "delete fail: {}".format(e))
    
    def _save_file_current_uid(self, fname, data):
        uid = self.allowed_uid
        if not uid:
            raise OSError("inactive")
        return save_file_for_uid(uid, fname, data)
    
    def _browse(self, cl, qs):
        path = qs.get("path", "/")
        try:
            items = os.listdir(path)
            items.sort()
        except OSError:
            self._notfound(cl)
            return
        html = ["<h3>Browse: {}</h3><ul>".format(path)]
        if path != "/":
            parent = "/" + "/".join([p for p in path.split("/") if p][:-1])
            if parent == "":
                parent = "/"
            html.append("<li><a href='/browse?path={}'>..</a></li>".format(parent))
        for it in items:
            p = (path.rstrip("/") + "/" + it) if path != "/" else ("/" + it)
            try:
                st = os.stat(p)
                is_dir = (st[0] & 0x4000) != 0
            except Exception:
                is_dir = False
            if is_dir:
                html.append(
                    "<li>[DIR] <a href='/browse?path={p}'>{i}</a></li>".format(p=p, i=it)
                )
            else:
                html.append(
                    "<li>{i} <a href='/delete?path={p}' onclick='return confirm(\"Delete?\")'>[del]</a></li>".format(
                        p=p, i=it
                    )
                )
        html.append("</ul>")
        self._ok(cl, "".join(html))
    
    # ---------- RTC /time ----------
    def _rtc_current_strings(self):
        """Gibt (date_str, time_str) zurück oder (None,None) wenn keine RTC."""
        if not self.rtc:
            return None, None
        try:
            y, m, d, wd, hh, mm, ss = self.rtc.now()
            date_str = "{:04d}-{:02d}-{:02d}".format(y, m, d)
            time_str = "{:02d}:{:02d}:{:02d}".format(hh, mm, ss)
            return date_str, time_str
        except Exception as e:
            print("[HTTP] rtc.now() failed:", e)
            return None, None

    def _parse_form_body(self, body):
        """Ganz einfache x-www-form-urlencoded-Parsing für ASCII-Felder."""
        res = {}
        try:
            txt = body.decode()
        except Exception:
            return res
        for part in txt.split("&"):
            if "=" in part:
                k, v = part.split("=", 1)
                # kein volles URL-Decoding nötig: wir erwarten nur Ziffern, '-', ':'
                res[k] = v
        return res

    def _time(self, cl, method, qs, body):
        msg = ""
        # POST: Body parsen und ggf. RTC setzen
        if method == "POST":
            form = self._parse_form_body(body)
            date_str = form.get("date")
            time_str = form.get("time")
            if self.rtc and date_str and time_str:
                try:
                    y, m, d = [int(x) for x in date_str.split("-")]
                    t_parts = [int(x) for x in time_str.split(":")]
                    while len(t_parts) < 3:
                        t_parts.append(0)
                    hh, mm, ss = t_parts[:3]
                    wday = 1  # Wochentag hier egal
                    self.rtc.set_time(y, m, d, wday, hh, mm, ss)
                    msg = "<p><b>RTC gesetzt</b> auf {} {}</p>".format(date_str, time_str)
                except Exception as e:
                    msg = "<p><b>Fehler beim Setzen der Uhr:</b> {}</p>".format(e)
            elif not self.rtc:
                msg = "<p><b>Fehler:</b> Keine RTC konfiguriert.</p>"

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
        self._ok(cl, form_html)

    # --- Routes ---
    def _home(self, cl):
        if self.allowed_uid:
            html = (
                "<p><b>Upload aktiv</b> f&uuml;r UID "
                "<code>{uid}</code>.</p>"
                "<p><a href='/upload'>Dateien f&uuml;r dieses Tag hochladen</a></p>"
            ).format(uid=self.allowed_uid)
        else:
            html = (
                "<p><b>Kein NFC-Tag aktiv.</b> "
                "Upload ist erst m&ouml;glich, wenn im Prog-Modus ein Tag aufgelegt wird.</p>"
            )
        html += "<p><a href='/time'>RTC-Uhr stellen</a></p>"
        html += "<p><a href='/browse?path=/'>Dateien durchsuchen</a></p>"
        self._ok(cl, html)
    
    def _upload_get(self, cl):
        if not self.allowed_uid:
            self._bad(cl, 403, "Upload deaktiviert (Prog/Tag erforderlich)")
            return
        self._ok(cl, "<h3>Upload</h3>" + _FORM.format(uid=self.allowed_uid))
    
    def _upload_post(self, cl, headers, body):
        if not self.allowed_uid:
            self._bad(cl, 403, "Upload deaktiviert (Prog/Tag erforderlich)")
            return

        ctype = headers.get("content-type", "").lower()
        clen = int(headers.get("content-length", "0"))

        if "multipart/form-data" not in ctype or "boundary=" not in ctype:
            self._bad(cl, 400, "multipart/form-data erforderlich")
            return

        # Body kann im ersten recv nicht komplett gewesen sein -> ggf. Rest nachladen
        body_bytes = body
        remain = clen - len(body_bytes)
        while remain > 0:
            chunk = cl.recv(min(1024, remain))
            if not chunk:
                break
            body_bytes += chunk
            remain -= len(chunk)

        # Boundary extrahieren
        boundary = ctype.split("boundary=")[1].strip()
        if boundary.startswith('"') and boundary.endswith('"'):
            boundary = boundary[1:-1]
        boundary_bytes = ("--" + boundary).encode()
        end_boundary = ("--" + boundary + "--").encode()

        saved = 0
        idx = body_bytes.find(boundary_bytes)
        while idx != -1:
            idx += len(boundary_bytes)
            # Überspringe optionales CRLF
            if body_bytes[idx:idx+2] == b"\r\n":
                idx += 2
            # Headerblock bis \r\n\r\n
            hdr_end = body_bytes.find(b"\r\n\r\n", idx)
            if hdr_end == -1:
                break
            header_block = body_bytes[idx:hdr_end]
            headers_part = {}
            for line in header_block.split(b"\r\n"):
                if b":" in line:
                    k, v = line.split(b":", 1)
                    headers_part[k.strip().lower()] = v.strip()
            cd = headers_part.get(b"content-disposition", b"").decode()
            m = ure.search('filename="([^"]+)"', cd)
            fname = m.group(1) if m else None

            # Datei-Inhalt
            data_start = hdr_end + 4
            next_boundary = body_bytes.find(boundary_bytes, data_start)
            if next_boundary == -1:
                next_boundary = body_bytes.find(end_boundary, data_start)
            if next_boundary == -1:
                file_data = body_bytes[data_start:]
                idx = -1
            else:
                # Trim das \r\n vor der Boundary
                file_data = body_bytes[data_start:next_boundary]
                if file_data.endswith(b"\r\n"):
                    file_data = file_data[:-2]
                idx = next_boundary

            if fname and file_data:
                try:
                    self._save_file_current_uid(fname, file_data)
                    saved += 1
                except Exception as e:
                    print("[HTTP] save error:", e)

            if idx == -1:
                break

        self._ok(
            cl,
            "<p>OK. Gespeichert: {} Datei(en) unter /{}</p>"
            "<p><a href='/upload'>weiter</a></p>".format(saved, self.allowed_uid)
        )
    
    # --- Poll (non-blocking) ---
    def poll(self):
        if not self.s or not self._listening:
            return
        try:
            cl, addr = self.s.accept()
        except OSError:
            # nichts zum akzeptieren
            return

        if _DEBUG: print("[HTTP] connection from", addr)
        cl.settimeout(2)
        try:
            req = cl.recv(1024)
            if not req:
                if _DEBUG: print("[HTTP] empty request, closing")
                cl.close()
                return

            head, _, body = req.partition(b"\r\n\r\n")
            lines = head.split(b"\r\n")
            reqline = lines[0].decode()
            method, path, _ = reqline.split(" ", 2)

            headers = {}
            for ln in lines[1:]:
                if b":" in ln:
                    k, v = ln.split(b":", 1)
                    headers[k.strip().lower().decode()] = v.strip().decode()

            route, qs = self._parse_qs(path)

            if _DEBUG: print("[HTTP] client request {} {}".format(method, route))

            if method == "GET" and route == "/":
                self._home(cl)
            elif method == "GET" and route == "/upload":
                self._upload_get(cl)
            elif method == "POST" and route == "/upload":
                self._upload_post(cl, headers, body)
            elif method == "GET" and route == "/browse":
                self._browse(cl, qs)
            elif method == "GET" and route == "/delete":
                self._delete(cl, qs)
            elif route == "/time":
                # sowohl GET als auch POST
                self._time(cl, method, qs, body)
            else:
                self._notfound(cl)
        except Exception as e:
            if _DEBUG: print("[HTTP] error while handling request:", e)
            try:
                self._bad(cl, 500, "error: {}".format(e))
            except Exception:
                pass
        try:
            cl.close()
        except Exception:
            pass
