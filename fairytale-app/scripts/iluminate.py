#!/usr/bin/env python3
# iluminate the Nokia 5110 LCD Display for number of seconds

import RPi.GPIO as GPIO
import time, os

Nokia5110BacklightPin = 21 # GPIO 21 for GPIO.BCM / PIN 40 for GPIO.BOARD
numberOfSecondsToIluminate = 30
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(Nokia5110BacklightPin, GPIO.OUT)

os.system("clear")
print "Backlight On for %s seconds", numberOfSecondsToIluminate

try:
    GPIO.output(Nokia5110BacklightPin, 1)
    sleep(numberOfSecondsToIluminate)
    GPIO.output(Nokia5110BacklightPin, 0)
except:
    GPIO.output(Nokia5110BacklightPin, 0)
