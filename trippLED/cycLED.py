#!/usr/bin/env python
import RPi.GPIO as GPIO ## Import GPIO library
import time ## Import 'time' library. Allows us to use 'sleep'
from flask import Flask, request
from flask_restful import Resource, Api ## for creation of restful api

## IP and Port to listen on
IP_ADDR = '0.0.0.0'
PORT = 3010 ## port the webserver listens for client requests

## pin numbering for the leds - check GPIO mode below
BLUELED = 33
REDLED = 37
GREENLED = 35

## setup GPIO
GPIO.setmode(GPIO.BOARD) ## Use board pin numbering
GPIO.setwarnings(False) ## disable warnings in case GPIO port is already set
GPIO.setup(BLUELED, GPIO.OUT) ## Setup GPIO Pin to OUT
GPIO.setup(REDLED, GPIO.OUT) ## Setup GPIO Pin to OUT
GPIO.setup(GREENLED, GPIO.OUT) ## Setup GPIO Pin to OUT

## initialize the app and the API
app = Flask(__name__)
api = Api(app)

## Define class to cycle through the 3 leds
class Cycle(Resource):
    def driveLed(pin, speed):
        GPIO.output(pin,True)## Switch on pin
        time.sleep(speed)## Wait
        GPIO.output(pin,False)## Switch off pin
    def cycle(self, ON_TIME, OFF_TIME):
        driveLed(REDLED,ON_TIME)
        time.sleep(OFF_TIME)
        driveLed(GREENLED,ON_TIME)
        time.sleep(OFF_TIME)
        driveLed(BLUELED,ON_TIME)
        time.sleep(OFF_TIME)
    def stop(self):
        GPIO.output(REDLED,False)## Switch on pin
        GPIO.output(GREENLED,False)## Switch on pin
        GPIO.output(BLUELED,False)## Switch off pin
        GPIO.cleanup()

    def get(self, mode):
        if (mode == 'on'):
            while (True):
                cycle(1, 0,5)
        else:
            stop()

## Define a class to blink a specific led
class Blink(Resource):
    def driveLed(pin, speed):
        GPIO.output(pin,True)## Switch on pin
        time.sleep(speed)## Wait
        GPIO.output(pin,False)## Switch off pin

    def get(self, color, mode, iterations, speed):
        if (color == 'red'):
            pin = REDLED
        elif (color == 'green'):
            pin = GREENLED
        else:
            pin = BLUELED
        
        if (mode == 'on'):
            for i in range(0,iterations):## Run loop numTimes
                driveLed(pin,speed)
                time.sleep(speed/2)## Wait
            GPIO.cleanup()
        else:
            GPIO.cleanup()

api.add_resource(Cycle, '/cycle/<string:mode>')
api.add_resource(Blink, '/blink/<string:color>/<string:mode>/<int:iterations>/<int:speed>')

# Main function
def main():
    try:
        app.run(host= IP_ADDR, port=PORT)
    except KeyboardInterrupt:
        # exit from the program
        sys.exit(0)

# Execute main if the script is directly called
if __name__ == "__main__":
    main()
