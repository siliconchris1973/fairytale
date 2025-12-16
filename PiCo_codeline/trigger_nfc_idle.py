from config import (
                    _DEBUG_TRIG as _DEBUG,
                    _TIMEOUT_FOR_IDLE_NFC_CHECK
                    )

class NfcIdleTrigger:
    def __init__(self, nfc):
        self.nfc_dev = nfc
        self._last_uid = None
    
    def poll(self, state="PLAY"):
        """
        NFC wird NUR im Idle abgefragt.
        """
        if state == "PLAY":
            return None
        
        try:
            if _DEBUG: print("[TRIGGER] checking for uid from NFC")
            uid = self.nfc_dev.read_uid(_TIMEOUT_FOR_IDLE_NFC_CHECK)
        except Exception as e:
            if _DEBUG: print("[TRIGGER] error ", e)
            return None
        
        if _DEBUG: print("[TRIGGER] returned uid from NFC is " +str(uid))
        if uid and uid != self._last_uid:
            self._last_uid = uid
            return ("start", uid)
        
        if not uid:
            self._last_uid = None
        
        return None
