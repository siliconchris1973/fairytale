/*
  ReadAnalogVoltage

  Reads an analog input on pin 0, converts it to voltage, and prints the result to the Serial Monitor.
  Graphical representation is available using Serial Plotter (Tools > Serial Plotter menu).
  Attach the center pin of a potentiometer to pin A0, and the outside pins to +5V and ground.

  This example code is in the public domain.

  http://www.arduino.cc/en/Tutorial/ReadAnalogVoltage
*/

const byte volPotPin                      = A0;   // the analog input pin that we use for the potentiometer
word lastSoundVolume                      = 0;    // keeps the last sound volume 
word lastVolSensorValue                   = 0;    // keeps the last read sensor value
const uint8_t minimumPotiValue            = 0;  // the minimum value the poti returns
const uint16_t maximumPotiValue           = 1023; // the maximum value the poti returns
const uint8_t minimumVolume               = 0;    // the minimum volume
const uint8_t maximumVolume               = 100;  // the maximum volume
const uint8_t valueDrift                  = 20;
  
// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(115100);

  pinMode(volPotPin, INPUT);       // connects to the potentiometer that shall control the volume
}

// the loop routine runs over and over again forever:
void loop() {
  plrAdjustVolume();
  
  delay(100);
}

static void plrAdjustVolume() {
    // TODO: Make this work again
    // volume control functions

    // read the input on analog pin 0 and check if we have a change in volume.
    //const float soundVolume = constrain(analogRead(volPotPin) / 10, 0, 100) / 100.00;
    const uint16_t volSensorValue = analogRead(volPotPin);
    
    if ((volSensorValue < (lastVolSensorValue - valueDrift)) || (volSensorValue > (lastVolSensorValue + valueDrift))) {
      const uint16_t soundVolume = map(volSensorValue, minimumPotiValue, maximumPotiValue, minimumVolume, maximumVolume);
      
      
        Serial.print(F("VOL sensor value: "));Serial.print(volSensorValue);
        Serial.print(F(" / last sensor value: "));Serial.print(lastVolSensorValue);
        Serial.print(F(" / volume: "));Serial.print(soundVolume);
        Serial.print(F(" / last volume: "));Serial.println(lastSoundVolume);
      
      
      lastSoundVolume = soundVolume;
      lastVolSensorValue = volSensorValue;
    }
}
