class UartTrigger:
    def __init__(self, uart):
        self.uart = uart
    
    def poll(self):
        if not self.uart.any():
            return None
        
        line = self.uart.readline()
        if not line:
            return None
        
        line = line.decode().strip()
        
        if line.startswith("START:"):
            uid = line.split(":", 1)[1]
            return ("start", uid)
        
        if line == "STOP":
            return ("stop", None)
        
        return None
