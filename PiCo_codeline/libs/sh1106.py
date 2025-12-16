# libs/sh1106.py — Minimaler SH1106 I2C Treiber (128x64) mit Chunked Writes
import framebuf, time

class SH1106_I2C:
    def __init__(self, width, height, i2c, addr=0x3C, external_vcc=False):
        self.width = width
        self.height = height
        self.i2c = i2c
        self.addr = addr
        self.buffer = bytearray(self.width * self.height // 8)
        self.fb = framebuf.FrameBuffer(self.buffer, self.width, self.height, framebuf.MONO_VLSB)
        self._init_display()

    # FrameBuffer-APIs
    def fill(self, c): self.fb.fill(c)
    def pixel(self, x,y,c): self.fb.pixel(x,y,c)
    def text(self, s,x,y,c=1): self.fb.text(s,x,y,c)
    def rect(self,x,y,w,h,c=1): self.fb.rect(x,y,w,h,c)
    def fill_rect(self,x,y,w,h,c=1): self.fb.fill_rect(x,y,w,h,c)

    def _cmd(self, b):
        self.i2c.writeto(self.addr, bytes((0x00, b)))

    def _data_chunk(self, buf):
        MAX_CHUNK = 16
        mv = memoryview(buf)
        i = 0
        while i < len(mv):
            self.i2c.writeto(self.addr, b'\x40' + mv[i:i+MAX_CHUNK])
            i += MAX_CHUNK

    def _init_display(self):
        for b in (
            0xAE,       0xD5, 0x80,
            0xA8, self.height - 1,
            0xD3, 0x00, 0x40,
            0xAD, 0x8B,       # charge pump
            0xA1, 0xC8,       # remap, scan dec
            0xDA, 0x12,       # com pins (128x64)
            0x81, 0xCF,
            0xD9, 0xF1,
            0xDB, 0x40,
            0xA4, 0xA6, 0xAF
        ):
            self._cmd(b)
        time.sleep_ms(50)
        self.fill(0); self.show()

    def show(self):
        # SH1106: 132 Spalten, sichtbarer Bereich ab Spalte 2
        for page in range(self.height // 8):
            self._cmd(0xB0 + page)
            self._cmd(0x02)   # low col = 2
            self._cmd(0x10)   # high col = 0
            start = page * self.width
            end   = start + self.width
            self._data_chunk(self.buffer[start:end])
