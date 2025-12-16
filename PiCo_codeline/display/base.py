# display/base.py
from config import t

class BaseDisplay:
    def init(self): pass
    def show_idle(self, msg1, msg2=""): pass
    def show_play(self, book, chapter, status="Play"): pass
    def show_prog_uid(self, uid_str): pass
    def show_status(self, line1, line2=""): pass
    def show_volume(self, percent:int): 
        """Kurzzeit-Overlay für Lautstärke (0..100)."""
        self.show_status("Volume", "{}%".format(int(percent)))
    
    def show_stop(self):
        """Explizite Stop Anzeige."""
        self.show_status("Stop", "")
    
    def set_time(self, hhmm:str):
        """Optionale Uhr-Einblendung; Backends können gezielt zeichnen."""
        pass
    
    def show_volume(self, percent:int):
        """Kurzzeit-Overlay für Lautstärke (0..100)."""
        self.show_status(t("VOLUME", "Volume"), "{}%".format(int(percent)))
    
    def show_stop(self):
        """Explizite Stop Anzeige."""
        self.show_status(t("STOP", "Stop"), "")
