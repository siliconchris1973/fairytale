# nfc/mock.py
from .base import BaseNFC
import utime

class MockNFC(BaseNFC):
    def __init__(self, uids=None, hold_ms=5000, gap_ms=2000):
        # Rotiert über UIDs: 5s aufgelegt, 2s weg
        self.uids = uids or ["325465743", "12345678"]
        self.hold = hold_ms
        self.gap  = gap_ms
        self.t0   = utime.ticks_ms()
        self.idx  = 0

    def init(self): pass

    def read_uid(self):
        t = utime.ticks_diff(utime.ticks_ms(), self.t0)
        cycle = self.hold + self.gap
        pos = t % cycle
        if pos < self.hold:
            return self.uids[self.idx]
        # beim Übergang zum „weg“-Abschnitt den Index einmal weiterschalten
        if pos < self.hold + 20:
            self.idx = (self.idx + 1) % len(self.uids)
        return None
