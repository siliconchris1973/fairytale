class ButtonTrigger:
    def __init__(self, buttons):
        self.buttons = buttons
    
    def poll(self):
        for ev in self.buttons.poll():
            if ev == "STOP":
                return ("stop", None)
        return None
