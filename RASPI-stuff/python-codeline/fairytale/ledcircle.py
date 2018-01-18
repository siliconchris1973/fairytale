#!/usr/bin/env python
#
# drives a circular led display to indicate playback
#
#

import RPi.GPIO as GPIO
import time
import sys

appDebug = True

class LEDCircle():
    myList= [40, 38, 37, 36, 35, 33, 32, 31, 30, 29, 27, 24]
    
    def __init__(self):
        GPIO.setmode(GPIO.BCM) ## Use board pin numbering
        GPIO.setwarnings(False)
        for i in range(0, len(self.myList)):
            if appDebug:
                print("setting channel at index", i, ": ", self.myList[i])
            GPIO.setup(self.myList[i], GPIO.OUT)
    
    def led_play(self, number_of_runs):
        i = 0
        while i < number_of_runs:
            if appDebug:
                print("driving led circle :: playback")
            for i in range(0, len(self.myList)):
                GPIO.output(self.myList[i],True)
                time.sleep(0.5)
                if i > 0:
                    GPIO.output(self.myList[i-1], False)
            i++
    
    def led_forward(self):
        while True:
            if appDebug:
                print("driving led circle :: fast forward")
            for i in range(0, len(self.myList)):
                GPIO.output(self.myList[i],True)
                time.sleep(0.1)
    
    def led_rewind(self):
        while True:
            if appDebug:
                print("driving led circle :: rewind")
            for i in range(len(self.myList), 0):
                GPIO.output(self.myList[i],True)
                time.sleep(0.1)

def main():
    if (len(sys.argv) > 1):
        if (sys.argv[1] == '--debug'):
            appDebug = True
            if appDebug:
                print("Starting demo mode - press Ctrl + C to stop")
            
            ledcircle = LEDCircle()
            try:
                while True:
                    ledcircle.led_play()
                    time.sleep(1)
                    ledcircle.led_forward()
                    ledcircle.led_forward()
                    ledcircle.led_forward()
                    time.sleep(1)
                    ledcircle.led_rewind()
                    ledcircle.led_rewind()
                    ledcircle.led_rewind()                                               
            except KeyboardInterrupt:
                if appDebug:
                    print("closing ...")
                GPIO.cleanup()
        else:
            print("If called from command line, you must provide --debug")
    else:
        print("If called from command line, you must provide --debug")

if __name__ == '__main__':
    main()


