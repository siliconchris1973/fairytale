# rtc/fake.py
import utime

class MockRTC:
    def now(self):
        # (year, month, day, weekday, hour, minute, second)
        t = utime.localtime()  # nutzt Pico-Systemzeit
        # weekday 0=Mon in CPython; wir mappen auf 1..7
        wd = (t[6] + 1)
        return (t[0], t[1], t[2], wd, t[3], t[4], t[5])

    def set_time(self, *a, **kw):
        #print("[RTC] MockRTC: set_time ignoriert")
