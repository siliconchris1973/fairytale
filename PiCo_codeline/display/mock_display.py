# display/null_display.py
from display.base import BaseDisplay
from config import _DEBUG_DISP as _DEBUG

class MockDisplay(BaseDisplay):
    def __init__(self, *a, **kw): pass
    def init(self): pass
    def show_idle(self, msg1, msg2=""):
        if _DEBUG: print("[DISPLAY] idle:", msg1, "|", msg2)
    def show_play(self, book, chapter, status="Play"):
        if _DEBUG: print("[DISPLAY] play:", status, "|", book, "|", chapter)
    def show_prog_uid(self, uid_str):
         if _DEBUG: print("[DISPLAY] prog UID:", uid_str)
    def show_status(self, line1, line2=""):
         if _DEBUG: print("[DISPLAY] status:", line1, "|", line2)
    def show_volume(self, percent:int):
         if _DEBUG: print("[DISPLAY] volume:", percent, "%")
    def set_time(self, hhmm:str):
         if _DEBUG: print("[DISPLAY] time:", hhmm)
    def show_stop(self):
         if _DEBUG: print("[DISPLAY] stop")
