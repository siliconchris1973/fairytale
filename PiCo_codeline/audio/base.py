# audio/base.py
class BaseAudio:
    def init(self): pass
    def set_volume(self, percent:int): pass
    def start(self, filepath:str, offset:int=0): pass
    def feed(self): """Call often; returns True if still playing."""; return False
    def pause(self): pass
    def resume(self): pass
    def stop(self) -> int: """Return last byte offset."""; return 0
