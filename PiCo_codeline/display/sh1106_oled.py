# display/sh1106_oled.py
from display.base import BaseDisplay
from display.oled_common import OledUI
from libs.sh1106 import SH1106_I2C
from config import _DEBUG_DISP as _DEBUG

class SH1106(BaseDisplay):
    def __init__(self, i2c, width=128, height=64, addr=0x3C):
        drv = SH1106_I2C(width, height, i2c, addr=addr)
        self.ui = OledUI(drv, keep_footer=True)
    
    # BaseDisplay API
    def init(self): pass
    def set_time(self, hhmm:str): self.ui.set_time(hhmm)
    def set_date(self, date_str): self.ui.set_date(date_str)
    def show_status(self, line1, line2=""): self.ui.show_status(line1, line2)
    def show_idle(self, msg1, msg2=""): self.ui.show_idle(msg1, msg2)
    def show_play(self, album, track, status="Play"): self.ui.show_play(album, track, status)
    def show_volume(self, percent:int): self.ui.show_volume(percent)
    def show_prog(self, uid, ip=None): self.ui.show_prog(uid, ip)
    def show_prog_uid(self, uid): self.ui.show_prog(uid, None)  # Backwards-compat
    def show_prompt_tag(self): self.ui.show_prompt_tag()
