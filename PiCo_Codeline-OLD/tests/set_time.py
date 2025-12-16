from machine import I2C, Pin
def dec2bcd(d): return ((d//10)<<4)|(d%10)

# Deine lokale Zeit hier einsetzen:
y,m,d,H,M,S = 2025,11,16,18,16,00

i2c = I2C(1, sda=Pin(2), scl=Pin(3), freq=100_000)
ADDR=0x68
i2c.writeto_mem(ADDR,0x00,bytes([dec2bcd(S),dec2bcd(M),dec2bcd(H),1,dec2bcd(d),dec2bcd(m),dec2bcd(y-2000)]))
print("RTC gestellt.")
