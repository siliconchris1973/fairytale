#!/usr/bin/env python
import RPi.GPIO as GPIO ## Import GPIO library
import time ## Import 'time' library. Allows us to use 'sleep'
from flask import Flask, request
from flask_restful import Resource, Api ## for creation of restful api

GPIO.setmode(GPIO.BOARD) ## Use board pin numbering
BLUELED = 33
REDLED = 37
GREENLED = 35
TIME_ON = 1 ## how long shall an led be turned on (either for blinking or cycle)
TIME_OFF = 1 ## how long shall an led be turned off (either for blinking or cycle)
IP_ADDR = '0.0.0.0'
PORT = 3010 ## port the webserver listens for client requests
NUM_TIMES = 3
GPIO.setwarnings(False) ## disable warnings in case GPIO port is already set
GPIO.setup(BLUELED, GPIO.OUT) ## Setup GPIO Pin to OUT
GPIO.setup(REDLED, GPIO.OUT) ## Setup GPIO Pin to OUT
GPIO.setup(GREENLED, GPIO.OUT) ## Setup GPIO Pin to OUT

## initialize the app and the API
app = Flask(__name__)
api = Api(app)

##Define a function named Blink()
class Cycle(Resource):
    def get(self, onoff):
        if (onoff == 'on'):
            GPIO.output(REDLED,True)## Switch on pin
            time.sleep(TIME_ON)## Wait
            GPIO.output(REDLED,False)## Switch off pin
            time.sleep(TIME_OFF)## Wait
            GPIO.output(GREENLED,True)## Switch on pin
            time.sleep(TIME_ON)## Wait
            GPIO.output(GREENLED,False)## Switch off pin
            time.sleep(TIME_OFF)## Wait
            GPIO.output(BLUELED,True)## Switch on pin
            time.sleep(TIME_ON)## Wait
            GPIO.output(BLUELED,False)## Switch off pin
            time.sleep(TIME_OFF)## Wait
        else:
            GPIO.output(REDLED,False)## Switch on pin
            GPIO.output(GREENLED,False)## Switch on pin
            GPIO.output(BLUELED,False)## Switch off pin
            GPIO.cleanup()

##Define a function named Blink()
class Blink(Resource):
    def get(self, color, number, speed):
        if (color == 'red'):
            pin = REDLED
        elif (color == 'green'):
            pin = GREENLED
        else:
            pin = BLUELED

        for i in range(0,NUM_TIMES):## Run loop numTimes
            print "Iteration " + str(i+1)## Print current loop
            GPIO.output(pin,True)## Switch on pin
            time.sleep(TIME_ON)## Wait
            GPIO.output(pin,False)## Switch off pin
            time.sleep(TIME_OFF)## Wait
        print "Done" ## When loop is complete, print "Done"
        GPIO.cleanup()

api.add_resource(Cycle, '/cycle/<string:onoff>')
api.add_resource(Blink, '/blink/<string:color>/<int:number>/<int:speed>')

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
