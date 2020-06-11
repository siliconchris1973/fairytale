/*
  ReadInfraredSignals

*/

#define DEBUG 1

// to enable the IR Remote Control option uncomment the following line - does not work currently
#define IRREMOTE 1

//
// include IR Remote Control
//
#ifdef IRREMOTE
  #include <IRremote.h>
#endif

// IR remote control 
#ifdef IRREMOTE
  const byte iRRemotePin    = A3;      // the pin the IR remote control diode (receiver) is connected to
  
  // IR Remote control
  // to reduce PROGMEM size I decided to not use the whole decimal value for each button on the remote control but instead do a calculation 
  // which reduces the needed size of the variable to hold the value but still creates different values for each button
  const uint16_t nextVal    = 57594;  // decoded value if button  NEXT  is pressed on remote
  const uint16_t prevVal    = 4346;   // decoded value if button  PREV  is pressed on remote
  const uint16_t volUpVal   = 53498;  // decoded value if button  UP    is pressed on remote
  const uint16_t volDwnVal  = 45306;  // decoded value if button  DOWN  is pressed on remote
  const uint16_t lightVal   = 47866;  // decoded value if button  HOME  is pressed on remote
  const uint16_t pauseVal   = 31482;  // decoded value if button  PAUSE is pressed on remote
  const uint16_t menuVal    = 16634;  // decoded value if button  MENU  is pressed on remote
  
  IRrecv irrecv(iRRemotePin);         // define an object to read infrared sensor on pin A4
  decode_results results;             // make sure decoded values from IR are stored 
#endif

uint16_t loopCounter = 0;


// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(115200);
  #ifdef IRREMOTE
    pinMode(iRRemotePin, INPUT);  // connects to the output port of the remote control (decoded values for each button in function playTrack())
    irrecv.enableIRIn();          // Begin the receiving process. This will enable the timer interrupt which consumes a small amount of CPU every 50 µs.
    irrecv.blink13(true);
  #endif
  #ifdef DEBUG
    Serial.print("\nwaiting for signal ...");
  #endif
}

// the loop routine runs over and over again forever:
void loop() {
  #ifdef DEBUG
    if (loopCounter > 100) {
      Serial.print(".");
      loopCounter = 0;
    }
    loopCounter++;
  #endif
  #ifdef IRREMOTE
      // IR Remote Control Layout
      //                +-------+
      //               |    UP   |                        3257242045
      //                +-------+
      //    +-------+   +-------+   +-------+
      //   |   LEFT  | |   HOME  | |  RIGHT  |  43265108  297656404   35532750
      //    +-------+   +-------+   +-------+
      //                +-------+
      //               |   DOWN  |                        537802768
      //                +-------+ 
      //       +-------+         +-------+  
      //      |  MENU  |         | PAUSE |      21493330              3938283307
      //       +-------+         +-------+
      //
      // check for IR Remote Control action
      if (irrecv.decode(&results)) { // get data from IR Remote
        const uint16_t switchValue = results.value;
        #ifdef DEBUG
        /*
          results.decode_type: Will be one of the following: NEC, SONY, RC5, RC6, or UNKNOWN.
          results.value: The actual IR code (0 if type is UNKNOWN)
          results.bits: The number of bits used by this code
          results.rawbuf: An array of IR pulse times
          results.rawlen: The number of items stored in the array
          */
          Serial.println(F("."));
            Serial.print(F("received raw signal "));
            Serial.print(switchValue);
        #endif
        
        switch (switchValue) {
          // PREV
          case prevVal:
            #ifdef DEBUG
              Serial.println(F(" - Prev track button"));
            #endif
            break;
          // NEXT
          case nextVal:
            #ifdef DEBUG
              Serial.println(F(" - Next track button"));
            #endif
            break;
          // PAUSE
          case pauseVal:
            #ifdef DEBUG
              Serial.println(F(" - Pause button"));
            #endif
            break;
          // LIGHT
          case lightVal:
            #ifdef DEBUG
              Serial.println(F(" - Light button"));
            #endif
            break;
          // VOL UP
          case volUpVal:
            #ifdef DEBUG
              Serial.println(F(" - Volume Up"));
            #endif
            break;
          // VOL DOWN
          case volDwnVal:
            #ifdef DEBUG
              Serial.println(F(" - Volume Down"));
            #endif
            break;
          // MENU
          case menuVal:
            #ifdef DEBUG
              Serial.println(F(" - Menu Button"));
            #endif
            break;
          default:
            break;
        }  
        delay(50);
        irrecv.resume(); 
      }
    #endif
  delay(100);
}
