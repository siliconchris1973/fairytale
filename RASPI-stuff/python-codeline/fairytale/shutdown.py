#!/usr/bin/env python3
# encoding: utf-8
"""
shutdown.py

shutdown script for Raspberry Pi
watch LOW level on pin 26 (customizable) to shut down system
status led on pin 23: ON = ready, BLINK = confirm button
"""


__version_info__ = (0, 0, 1)
__version__ = '.'.join(map(str, __version_info__))
__author__ = "c.guenther@mac.com"

try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except ImportError:
    print('GPIO not accessible, running in demo mode')
    GPIO_AVAILABLE = False

from subprocess import call
import time
import config
# either take pin designation form config or set it manually
SHUTDOWN_PIN = config.shutdown_pin
STATUS_LIGHT_PIN = config.status_light_pin
#SHUTDOWN_PIN=26
#STATUS_LIGHT_PIN = 23

# use the pin number as on the raspi board

if GPIO_AVAILABLE:
    GPIO.setmode(GPIO.BOARD)

    # set pin 23 as output and HIGH, pin 26 is input
    # output on 23 flashes an LED and input on 26 checks for pressed button
    GPIO.setup(SHUTDOWN_PIN, GPIO.IN)
    GPIO.setup(STATUS_LIGHT_PIN, GPIO.OUT)
    GPIO.output(STATUS_LIGHT_PIN, True)
    GPIO.add_event_detect(SHUTDOWN_PIN, GPIO.RISING, callback=shutdown, bouncetime=200) # Set up an interrupt to look for button presses


# start the loop for every .5 seconds, waiting for LOW on pin 23
# then 2 short flashes with led to confirm and shutdown to sleep mode
def loop():
    try:
        input()
    except KeyboardInterrupt:
        print(' received, shutting down')


def shutdown(pin):
    print('shutdown button pressed, press again within 3 seconds to shutdown')
    cursec = time.localtime()
    while time.localtime() < cursec + 3:
        if GPIO_AVAILABLE:
            if not (GPIO.input(pin)):
                GPIO.output(STATUS_LIGHT_PIN, False)
                time.sleep(.1)
                GPIO.output(STATUS_LIGHT_PIN, True)
                time.sleep(.1)
                GPIO.output(STATUS_LIGHT_PIN, False)
                time.sleep(.1)
                GPIO.output(STATUS_LIGHT_PIN, True)
                call('halt', shell=False)
            else:
                print('\n.')
        else:
            print(str(cursec))

if __name__ == '__main__':
    if GPIO_AVAILABLE:
        print('starting up, now waiting for input on button ' + str(SHUTDOWN_PIN) + ' to initiate shutdown')
    else:
        print('running in demo mode without GPIO')
    loop()