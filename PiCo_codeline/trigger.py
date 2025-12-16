class TriggerSource:
    """
    Liefert Steuer-Events für den PlayerController.

    Rückgabeformat:
      ("start", uid)   -> neues Album starten
      ("stop", None)  -> Wiedergabe stoppen
      None             -> kein Event
    """
    
    def poll(self):
        return None
