# rtc/ds3231.py
# Minimaler DS3231-Treiber (I2C) für Zeit-lesen/-setzen
from machine import I2C
from config import (
                    i2c as SHARED_I2C,
                    RTC_I2C_ADDR
                    )

def _bcd2i(b): return (b >> 4) * 10 + (b & 0x0F)
def _i2bcd(i): return ((i // 10) << 4) | (i % 10)

class DS3231:
    def __init__(self, i2c: I2C = None, addr: int = RTC_I2C_ADDR):
        self.i2c = i2c or SHARED_I2C
        self.addr = addr
    
    def now(self):
        # returns (year, month, day, weekday, hour, minute, second)
        self.i2c.writeto(self.addr, b'\x00')          # start at seconds
        data = self.i2c.readfrom(self.addr, 7)
        ss = _bcd2i(data[0] & 0x7F)
        mm = _bcd2i(data[1] & 0x7F)
        hh = _bcd2i(data[2] & 0x3F)                   # 24h
        wday = _bcd2i(data[3] & 0x07)
        day = _bcd2i(data[4] & 0x3F)
        month = _bcd2i(data[5] & 0x1F)
        year = 2000 + _bcd2i(data[6])
        return (year, month, day, wday, hh, mm, ss)
    
    def set_time(self, year, month, day, wday, hour, minute, second):
        # wday: 1=Mon … 7=Son oder beliebig (DS3231 nutzt nur 3 bits)
        buf = bytes([
            0x00,
            _i2bcd(second & 0x7F),
            _i2bcd(minute & 0x7F),
            _i2bcd(hour   & 0x3F),
            _i2bcd(wday   & 0x07),
            _i2bcd(day    & 0x3F),
            _i2bcd(month  & 0x1F),
            _i2bcd((year - 2000) & 0xFF),
        ])
        self.i2c.writeto(self.addr, buf)
