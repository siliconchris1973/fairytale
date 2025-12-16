# nfc/base.py
class BaseNFC:
    def init(self): pass
    def read_uid(self):
        """Return UID string or None if no tag."""
        return None
