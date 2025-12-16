from machine import UART, Pin
import utime

RST_PIN = 4   # RSTO an GP4
u = UART(0, baudrate=115200, tx=Pin(0), rx=Pin(1))
rst = Pin(RST_PIN, Pin.OUT, value=1)

def wake_and_query():
    # harter Reset
    rst.value(0); utime.sleep_ms(10); rst.value(1); utime.sleep_ms(30)

    # Puffer leeren
    while u.any(): u.read()

    # robuster Wakeup
    for _ in range(3):
        u.write(b"\x55" + b"\x00"*24)
        utime.sleep_ms(5)

    # GETFIRMWARE senden
    u.write(b"\x00\x00\xff\x02\xfe\xd4\x02\x2a\x00")

    # Antwort einsammeln (bis 1,2 s)
    t0 = utime.ticks_ms(); buf = b""
    while utime.ticks_diff(utime.ticks_ms(), t0) < 1200:
        if u.any(): buf += u.read()
        utime.sleep_ms(2)
    print("HEX:", buf.hex())

wake_and_query()
