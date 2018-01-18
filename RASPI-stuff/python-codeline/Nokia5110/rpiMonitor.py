#!/usr/bin/env python
import httplib, time, os, sys, json
import pcd8544.lcd as lcd

# class Process dedicated to process data get from Client
# and send information to LCD and console
class Process:
  # Process constructor
  def __init__(self):
    # Initialize LCD
    lcd.init()
    # Turn the backlight on
    lcd.backlight(1)

  def run(self, jsonString):
    # Parse data as json
    data = json.loads( jsonString )
    # Try to get data from json or return default value
    try:
      rpi_temperature = data['living_room_temp']
    except:
      rpi_temperature="--.---"
    try:
      rpi_humidity = data['humidity']
    except:
      rpi_humidity = "--"
    # Construct string to be displayed on screens
    temperature = "Temp: %s C" % rpi_temperature
    humidity = "Humidity: %s %%" % rpi_humidity
    lcd.gotorc(0,1)
    lcd.text("RPi-Monitor")
    lcd.gotorc(2,0)
    lcd.text(temperature)
    lcd.gotorc(3,0)
    lcd.text(humidity)
    # Also print string in console
    os.system("clear")
    print " RPi-Monitor "
    print
    print temperature
    print humidity
    print
    time.sleep(1)

# Class client design to work as web client and get information
# from RPi-Monitor embedded web server
class Client:
  # Client constructor
  def __init__(self):
    # Create a Process object
    self.process = Process()

  def run(self):
    # Infinite loop
    while True:
     try:
       # Initiate a connection to RPi-Monitor embedded server
       connection = httplib.HTTPConnection("localhost", 8888)
       # Get the file dynamic.json
       connection.request("GET","/dynamic.json")
       # Get the server response
       response = connection.getresponse()
       if ( response.status == 200 ):
         # If response is OK, read data
         data = response.read()
         # Run process object on extracted data
         self.process.run(data)
       # Close the connection to RPi-Monitor embedded server
       connection.close()
     finally:
       # Wait 5 secondes before restarting the loop
       time.sleep(5)

# Main function
def main():
  try:
    # Create a Client object
    client = Client()
    # Run it
    client.run()
  except KeyboardInterrupt:
    # if Ctrl+C has been pressed
    # turn off the lcd backlight
    lcd.backlight(0);
    # exit from the program
    sys.exit(0)

# Execute main if the script is directly called
if __name__ == "__main__":
    main()
