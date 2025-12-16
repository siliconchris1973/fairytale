# libs/ssd1306.py  -- Minimaler SSD1306 I2C Treiber (128x64/32)
# kompatibel zu: from libs.ssd1306 import SSD1306_I2C
from micropython import const
import framebuf, time

_SET_CONTRAST     = const(0x81)
_DISPLAY_ALL_ON_RESUME = const(0xA4)
_DISPLAY_ALL_ON   = const(0xA5)
_NORMAL_DISPLAY   = const(0xA6)
_INVERT_DISPLAY   = const(0xA7)
_DISPLAY_OFF      = const(0xAE)
_DISPLAY_ON       = const(0xAF)
_SET_DISPLAY_OFFSET = const(0xD3)
_SET_COM_PINS     = const(0xDA)
_SET_VCOM_DETECT  = const(0xDB)
_SET_DISPLAY_CLOCK_DIV = const(0xD5)
_SET_PRECHARGE    = const(0xD9)
_SET_MULTIPLEX    = const(0xA8)
_SET_LOW_COLUMN   = const(0x00)
_SET_HIGH_COLUMN  = const(0x10)
_SET_START_LINE   = const(0x40)
_MEMORY_MODE      = const(0x20)
_COLUMN_ADDR      = const(0x21)
_PAGE_ADDR        = const(0x22)
_COM_SCAN_INC     = const(0xC0)
_COM_SCAN_DEC     = const(0xC8)
_SEG_REMAP        = const(0xA0)
_CHARGE_PUMP      = const(0x8D)
_EXTERNAL_VCC     = const(0x1)
_SWITCH_CAP_VCC   = const(0x2)

class SSD1306:
    def __init__(self, width, height, external_vcc=False):
        self.width  = width
        self.height = height
        self.external_vcc = external_vcc
        self.pages = self.height // 8
        self.buffer = bytearray(self.pages * self.width)
        self.fb = framebuf.FrameBuffer(self.buffer, self.width, self.height, framebuf.MONO_VLSB)

    # FrameBuffer-Weiterleitungen
    def fill(self, c): self.fb.fill(c)
    def pixel(self, x, y, c): self.fb.pixel(x, y, c)
    def text(self, s, x, y, c=1): self.fb.text(s, x, y, c)
    def line(self, x1,y1,x2,y2,c=1): self.fb.line(x1,y1,x2,y2,c)
    def rect(self, x,y,w,h,c=1): self.fb.rect(x,y,w,h,c)
    def fill_rect(self, x,y,w,h,c=1): self.fb.fill_rect(x,y,w,h,c)
    def invert(self, inv): self.write_cmd(_INVERT_DISPLAY if inv else _NORMAL_DISPLAY)

    def poweroff(self): self.write_cmd(_DISPLAY_OFF)
    def poweron(self): self.write_cmd(_DISPLAY_ON)
    def contrast(self, contrast): self.write_cmd(_SET_CONTRAST); self.write_cmd(contrast & 0xFF)

    # zu überschreiben in Subklasse
    def write_cmd(self, cmd): raise NotImplementedError()
    def write_data(self, buf): raise NotImplementedError()

    def show(self):
        self.write_cmd(_COLUMN_ADDR); self.write_cmd(0); self.write_cmd(self.width - 1)
        self.write_cmd(_PAGE_ADDR);   self.write_cmd(0); self.write_cmd(self.pages - 1)
        self.write_data(self.buffer)

    def init_display(self):
        for cmd in (
            _DISPLAY_OFF,
            _SET_DISPLAY_CLOCK_DIV, 0x80,
            _SET_MULTIPLEX, self.height - 1,
            _SET_DISPLAY_OFFSET, 0x00,
            _SET_START_LINE | 0x00,
            _CHARGE_PUMP, 0x10 if self.external_vcc else 0x14,
            _MEMORY_MODE, 0x00,
            _SEG_REMAP | 0x01,
            _COM_SCAN_DEC,
            _SET_COM_PINS, 0x02 if self.height == 32 else 0x12,
            _SET_CONTRAST, 0x8F if self.height == 32 else (0x9F if self.external_vcc else 0xCF),
            _SET_PRECHARGE, 0x22 if self.external_vcc else 0xF1,
            _SET_VCOM_DETECT, 0x40,
            _DISPLAY_ALL_ON_RESUME,
            _NORMAL_DISPLAY,
            _DISPLAY_ON,
        ):
            self.write_cmd(cmd)
        time.sleep_ms(50)
        self.fill(0); self.show()

class SSD1306_I2C(SSD1306):
    def __init__(self, width, height, i2c, addr=0x3C, external_vcc=False):
        self.i2c = i2c
        self.addr = addr
        super().__init__(width, height, external_vcc)
        self.init_display()
    def write_cmd(self, cmd):
        self.i2c.writeto_mem(self.addr, 0x00, bytes([cmd]))
    def write_data(self, buf):
        # 0x40 = Co=0, D/C#=1  (Daten)
        self.i2c.writeto(self.addr, b'\x40' + buf)
