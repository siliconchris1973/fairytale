#!/usr/bin/env python3
import RPi.GPIO as GPIO ## Import GPIO library
import time ## Import 'time' library. Allows us to use 'sleep'

GPIO.setmode(GPIO.BOARD) ## Use board pin numbering
BLUELED = 33
REDLED = 35
GREENLED = 37
GPIO.setup(BLUELED, GPIO.OUT) ## Setup GPIO Pin to OUT
GPIO.setup(REDLED, GPIO.OUT) ## Setup GPIO Pin to OUT
GPIO.setup(GREENLED, GPIO.OUT) ## Setup GPIO Pin to OUT


##Define a function named Blink()
def Blink(pin, numTimes,speed):
    for i in range(0,numTimes):## Run loop numTimes
        print "Iteration " + str(i+1)## Print current loop
        GPIO.output(pin,True)## Switch on pin 7
        time.sleep(speed)## Wait
        GPIO.output(pin,False)## Switch off pin 7
        time.sleep(speed)## Wait
    print "Done" ## When loop is complete, print "Done"
    GPIO.cleanup()

## Ask user for total number of blinks and length of each blink
iterations = raw_input("Enter total number of times to blink: ")
speed = raw_input("Enter length of each blink(seconds): ")
led = raw_input("Enter color of led to blink (red|green|blue): ")

if (led == "red"):
    driveled = REDLED
else if (led == "green"):
    driveled = GREENLED
else:
    driveled = BLUELED

## Start Blink() function.
## Convert user input from strings to numeric data types and pass to Blink() as parameters
Blink(int(driveled), int(iterations),float(speed))
