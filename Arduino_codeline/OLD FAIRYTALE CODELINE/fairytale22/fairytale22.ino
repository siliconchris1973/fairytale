#define VERSION 22

// BOF preprocessor bug prevent - insert me on top of your arduino-code
#if 1
__asm volatile ("nop");
#endif
/*
   Fairytale Main program

   This programm will play albums (audiobooks or music) stored on the SD card inserted into
   the Adafruit Music Maker Shield. Selection of the album/audiobook to play is done by 
   placing corresponding NFC Tags on the NFC Reader.
   
   Upon detection of an NFC Tag, the program will retrieve the tag's UID and use this to scan 
   what I call the TrackDB to find a matching directory to play.
   
   The TrackDB is a list of files in a special directory (SYSTEM00) on the SD card. The TrackDB
   files are of the form:

      taguid:directory:track    e.g.:    46722634231761290:findorie:1
   
   In the given example:
      46722634231761290   is the UID of the NFC Tag
      findorie            is the directory from which to play the files
      1                   is the number of the track with which to start playback

   The program will take the retrieved information and then start a for-loop beginning with 
   the provided first track until all consecutive numbered tracks are played. After playback of all
   files is finished, the program will resume it's main loop, delay operation for roughly 15 seconds
   (to give the user the chance to remove the just used Tag from the reader) and then wait until 
   it detects the next tag.
   
   While advancing through the files in th diectory, the program will update the TrackDB-File with the 
   number of the currently played track. Doing so allows for interrupted playbacks - tag is removed and 
   later put back on when the playback will start with the last track in playback. 
   
   For this to work, a couple of restrictions are in place:
   1. All filenames must be in the format  trackXXX.mp3  - where XXX is a numbering from 001 to 127
   2. You can have a maximum of 127 files per directory - as I use a char to count the files to preserve memory
   3. All directory names must be exactly 8 chars long - use any combination of a-z and 0-9 chars for the name
   4. if a file is missing in a consecutive order, you may get a glitch in the sound 
   5. There is a slight delay when one file is played and before the next one starts


   While the album (or file) is played an operations light is fading up and down in intensity. 
   On warnings or errors a warning or error light is lit up respectively. There are 3 different warning 
   or error conditions:
   1) Missing information for playback warning
   2) Low Battery warning
   2) Missing hardware error
   
   Errors shown via the error light (also cause the system to halt and the arduino must be turned off):
   - Music Maker Shield not found
   - Music Maker shield not on an interrupt enabled pin
   - SD card not found
   - NFC Reader not found

   Warnings shown via a light (Arduino can stay turned on):
   - Low battery warning (surely the arduino will turn off but until then it will continue to operate)
   - no directory found for the NFC Tag (aka TrackDB is missing an entry for the Tag)
   - no directory found on the SD card that match the NFC Tag TrackDB record
   - no files in the provided directory
   - a missing file in a consecutive list of ordered files in the directory
     this may happen in case the files are not numerically ordered without a gap: 
     track001.mp3 exist, track002.mp3 is missing but track003.mp3 exists again

   Additionally to the warning or error lights certain messages are spoken through the music maker shield. 
   Voiced errors and warnings are:
   - Low Battery warning
   - no directory found for the NFC Tag (aka TrackDB is missing an entry for the Tag)
   - no directory found on the SD card that match the NFC Tag TrackDB record
   - no file(s) in the directory on the SD card

   
   4 buttons are included:
   - pause / unpause     - pauses the playback or unpauses a paused playback
   - next                - play the next track in a consecurtive list of ordered files
   - previous            - play the previous track in a consecurtive list of ordered files
   - light on / off      - turn the operations light fader on or off

   
   The box is capable of being controlled by a remote control with the following functions
   - Volume Up
   - Volume Down
   - Previos Track
   - Next Track
   - Pause/Resume
   - Light effect on / off

   
   Used Pins:
     NAME             PIN  USAGE
   - CLK / PN532_SCK   13  SPI Clock shared with VS1053, SD card and NFC breakout board 
   - MISO / PN532_MISO 12  Input data from VS1053, SD card and NFC breakout board 
   - MOSI / PN532_MOSI 11  Output data to VS1053, SD card and NFC breakout board 
   
   - SHIELD_CS          7  VS1053 chip select pin (output)
   - SHIELD_DCS         6  VS1053 Data/command select pin (output)
   - DREQ               3  VS1053 Data request, ideally an Interrupt pin
    
   - CARDCS             4  SD Card chip select pin
    
   - PN532_SS          10  NFC breakout board chip select pin

   - infoLedPin         5  the pin to which the operation led is connected to
   - warnLedPin         8  the pin to which the warning led is connected to
   - errorLedPin        9  the pin to which the error led is connected to (e.g. used for LBO of powerboost 1000c)
    

   - volPotPin         A0  the analog input pin that we use for the potentiometer
   - btnLinePin        A1  pin to which the button line (4 buttons) is connected to
   - batLowPin         A2  the pin on which the powerboost 1000c indicates a low baterry (LBO) - ouput done via errorLedPin
   - iRRemotePin       A3  the pin on which the powerboost 1000c indicates a low baterry (LBO) - ouput done via errorLedPin
   - programming       A4  the pin the program button is connected to. The program button changes the functionality
                           of the overall program in that (if pressed) the code will register a new tag for use with 
                           an album directory currently not connected to a tag (functionality yet to come)
*/

// make sure to change this to comment this out before uploading in production as it turns on lots and lots of serial messages
//#define DEBUG 1



//
// turn ON / OFF certain hardware features
//

// to enable the IR Remote Control option uncomment the following line
//#define IRREMOTE 1

// to enable the 4 control buttons uncomment the following line
#define BUTTONS 1

// to enable the volume potentiometer uncomment the follwing line
#define VOLUMEPOT 1

// to enable the low battery warning with light and voice uncomment the follwing line
//#define LOWBAT 1

// to enable the operations light on the front of the box, uncomment the following line
#define OPRLIGHT 1
// to enable time based operations light - turns off the light after 30 Minutes - uncomment the following line
//#define OPRLIGHTTIME 1

// Define the NFC <-> Album implementation
// ONLY ONE of the these two options can be chosen
// to use NDEF to get the album directory uncomment the following line
#define NFCNDEF 1
// to use the Adafruit NFC library to get the Tag UID and retrieve the directory from the trackDb 
// uncomment the following line. 
//#define NFCTRACKDB 1

// uncomment the next line to enable resuming the last played album on switch on
// this is achieved via a special file on the SD card and works without a tag but uses the pause/resume button instead
//#define RESUMELAST 1

//
// include SPI and SD libraries
//
#include <SPI.h>
#include <SD.h>

// These are the SPI pins shared among all components
#define CLK           13    // SPI Clock shared with VS1053, SD card and NFC breakout board 
#define MISO          12    // Input data from VS1053, SD card and NFC breakout board 
#define MOSI          11    // Output data to VS1053, SD card and NFC breakout board 

//
// SETUP MUSIC MAKER SHIELD
// 
#include <Adafruit_VS1053.h>
// These are the pins used for the music maker shield
#define SHIELD_RESET  -1    // VS1053 reset pin (unused!)
#define SHIELD_CS      7    // VS1053 chip select pin (output)
#define SHIELD_DCS     6    // VS1053 Data/command select pin (output)

//
// SETUP SD CARD
//
// These are common pins between breakout and shield
#define CARDCS         4    // Card chip select pin
// DREQ should be an Int pin, see http://arduino.cc/en/Reference/attachInterrupt
#define DREQ           3    // VS1053 Data request, ideally an Interrupt pin
// Create shield object
Adafruit_VS1053_FilePlayer musicPlayer = Adafruit_VS1053_FilePlayer(SHIELD_RESET, SHIELD_CS, SHIELD_DCS, DREQ, CARDCS);


//
// SETUP NFC ADAPTER
//
#ifdef NFCNDEF
  // these includes are sued for the NDEF implementation
  #include <PN532_SPI.h>
  #include <PN532.h>
  #include <NfcAdapter.h>
  #define PN532_SCK     13    // SPI Clock shared with VS1053, SD card and NFC breakout board 
  #define PN532_MISO    12    // Input data from VS1053, SD card and NFC breakout board 
  #define PN532_MOSI    11    // Output data to VS1053, SD card and NFC breakout board 
  #define PN532_SS      10    // NFC breakout board chip select pin
  PN532_SPI pn532spi(SPI, PN532_SS);
  NfcAdapter nfc = NfcAdapter(pn532spi);
#endif

#ifdef NFCTRACKDB
  // INCLUDE Adafruit NFC LIbrary here
#endif


//
// include IR Remote Control
//
#ifdef IRREMOTE
  #include <IRremote.h>
#endif


//       VV       VV   Y       RRRRR
//        VV     VV   AAA     RR   RR
//         VV   VV   AA AA    RRRRRR
//          VV VV   AAAAAAA   RR   RR
//            V    AA     AA  RR   RR
//
// mp3 player variables
char plrCurrentFolder[]     = "system00";                // directory containing the currently played tracks - system00 is the system message directory
char filename[]             = "/system00/track001.mp3";  // path and filename of the track to play - we start with the welcome track
byte firstTrackToPlay       = 1;                         // the track number to play (used for the loop)
char nextTrackToPlay        = 1;                         // the track number to play next (can also be the previos number or a -1 in case of an error)

// file to hold the last played album (aka directory) name - from here we may retrieve other data from the trackDb 
#ifdef RESUMELAST
  const char lastPlayedSessionFile[] = "/trackdb0/LASTPLAY.TDB";
#endif

// trackDb on the SD card - this is where we store the NFC TAG <-> Directory connection and the track to start playback with
#ifdef NFCTRACKDB
  const char trackDbDir[]     = "/trackdb0";               // where do we store the files for each album 
  const char trackDbFile[]    = "/trackdb0/albumnfc.txt";  // path to the file that holds the connection between an NFC tag UID and the corresponding directory / file name
  char tDirFile[sizeof(trackDbFile)];                      // a char array to hold the path to the file with track and directory infos (name is shared with directory name plus .txt
  char trackDbEntry[35];                                   // will hold a nfc <-> album info connection in the form of [NFC Tag UID]:[album]:[Track] e.g.: 43322634231761291:larsrent:1
  
  // NFC Tag data
  byte uid[] = { 0, 0, 0, 0, 0, 0, 0 };    // Buffer to store the returned UID
  char charUid[22];                        // char representation of the UID
  byte uidLength;                          // Length of the UID (4 or 7 bytes depending on ISO14443A card type)
#endif 

// volume control variables for the analog poti
#ifdef VOLUMEPOT
  const byte volPotPin     = A0;      // the analog input pin that we use for the potentiometer
  word lastVolSensorValue  = 0;       // keeps the last read sensor value
#endif

// control buttons definition
#ifdef BUTTONS
  const byte btnLinePin    = A1;      // pin on which the button line (4 buttons) is connected
  
  word btnVal;                        // stores the value we receive on the btnLinePin for comparance with the predefined analog reads for the 4 buttons
  const byte btnValDrift   = 5;       // maximum allowed difference + and - the predefined value for each button we allow
  const word btnPressDelay = 500;     // delay in milliseconds to prevent double press detection
  unsigned long btnPressTime = 0;     // time in millis() when the button was pressed
  const word btnLightValue = 1021;    // 33 Ohm  - The value we receive from analog input if the Light On/Off Button is pressed
  const word btnPauseValue = 933;     // 1K Ohm  - The value we receive from analog input if the Pause Button is pressed
  const word btnNextValue  = 1002;    // 220 Ohm - The value we receive from analog input if the Next (aka Fast Forward) Button is pressed
  const word btnPrevValue  = 991;     // 330 Ohm - The value we receive from analog input if the Previos (aka Prev or Rewind) Button is pressed
  const word minBtnValue   = 800;     // we use this value to determine, whether or not to check the buttons. Set to lower val than smallest of buttons
#endif

// IR remote control 
#ifdef IRREMOTE
  const byte iRRemotePin   = A4;      // the pin the IR remote control diode (receiver) is connected to
  
  // IR Remote control
  // to reduce PROGMEM size I decided to not use the whole decimal value for each button on the remote control but instead do a calculation 
  // which reduces the needed size of the variable to hold the value but still creates different values for each button
  // Function  Original code   Minus         DIV   code I use
  // right:    2011291898    - 2011000000) / 100 = 2919
  // left:     2011238650    - 2011000000) / 100 = 2387
  // Up:       2011287802    - 2011000000) / 100 = 2878
  // Down:     2011279610    - 2011000000) / 100 = 2796
  // Middle:   2011282170    - 2011000000) / 100 = 2822
  // Pause:    2011265786    - 2011000000) / 100 = 2658
  // Menu:     2011250938    - 2011000000) / 100 = 2509
  const uint16_t nextVal    = 2919; // decoded value if button  NEXT  is pressed on remote
  const uint16_t prevVal    = 2387; // decoded value if button  PREV  is pressed on remote
  const uint16_t volUpVal   = 2878; // decoded value if button  UP    is pressed on remote
  const uint16_t volDwnVal  = 2796; // decoded value if button  DOWN  is pressed on remote
  const uint16_t lightVal   = 2822; // decoded value if button  HOME  is pressed on remote
  const uint16_t pauseVal   = 2658; // decoded value if button  PAUSE is pressed on remote
  const uint16_t menuVal    = 2509; // decoded value if button  MENU  is pressed on remote
  
  IRrecv irrecv(iRRemotePin);         // define an object to read infrared sensor on pin A4
  decode_results results;             // make sure decoded values from IR are stored 
#endif


// battery control
#ifdef LOWBAT
  const byte lowBatPin   = A2;      // pulled high to BAT but when the charger detects a low voltage (under 3.2V) the pin will drop down to 0V (LOW)
  boolean lowBatWarn     = true;    // we use this bool so we may only tell the user every 5 Minite sthat the Battery is low
#endif


// LIGHT EFFECTS
#ifdef OPRLIGHT
  #ifdef OPRLIGHTTIME
    unsigned long lightStartUpTime = 0; // millis() the operations light started
  #endif
  const byte infoLedPin    = 5;       // the pin to which the operation led is connected to
  boolean lightOn          = true;    // if true, the operations light fader is active. is set to false via a button, or after a maxLightTime (see below) is reached
#endif
const byte warnLedPin    = 8;       // the pin to which the warning led is connected to
const byte errorLedPin   = 9;       // the pin to which the error led is connected to



//
//        PPPPPP    RRRRR     OOOOOO   TTTTTTTT   OOOOOO   TTTTTTTT  YY    YY   PPPPPP    EEEEE   SSSSS
//       PP    PP  RR    RR  OO    OO     TT     OO    OO     TT      YY  YY   PP    PP  EE      SS
//       PPPPPPP   RRRRRRR  OO      OO    TT     OO    OO     TT       YYYY    PPPPPPP   EEEE     SSSSS
//       PP        RR    RR  OO    OO     TT     OO    OO     TT        YY     PP        EE          SS
//       PP        RR    RR   OOOOOO      TT      OOOOOO      TT        YY     PP        EEEEEE  SSSSS
//
// these are the prototypes to retrieve and set directory and track to play - aka work on the tagdb
static boolean getDirAndTrackToPlay(boolean);  // retrieve the directory and track number either from the Tag (true) or from last played session file (false)
static boolean writeTrackDbEntry(void);        // store Tag UID, plrCurrentFolder and firstTrackToPlay in the trackDb (files on SD)


// prototype for NFC check for tag presence
#ifdef NFCTRACKDB
  static boolean checkTag(void);        // check if the tag is still on the reader - returns true or falce
#endif

// prototype for volume control via potentiometer
#ifdef VOLUMEPOT
  static void plrAdjustVolume(void);    // function to check for changes on the volume control and adjust volume accrodingly
#endif


// these are the prototypes for the mp3 player controller
static void plrStop(void);              // stops the player and return 0
static void plrTogglePause(void);       // pause and unpause the player and return 0
static char playAlbum(byte);            // plays the album from plrCurrentFolder: returns -1 for error or a higher 
static char playTrack(byte);            // plays a track as defined by the global vars: returns -1 for error, 0 for success and track number to play next


// prototype for warning
static void issueWarning(const char[], const char[], boolean); // the new warning method


// these are the prototypes to work on files and general helpers
static byte countFiles(File);           // return the number of files in a directory passed as a File descriptor


// helper functions to set global vars
static boolean setFileNameToPlay(byte); // sets filename of the track to play from global vars plrCurrentFolder and plrCurrentFile and returns true if it exists
static void setTrackDbEntry(void);


// these are the prototypes for the led
#ifdef OPRLIGHT
  static void switchLightState(void);   // switch the boolean var lightOn from true to false and vice versa - in case light is lightOn is set to true, lightStartUpTime is set to millis()
#endif

//
//       SSSSSS  EEEEEE  TTTTTTTT  UU   UU   PPPPP
//      SS       EE         TT     UU   UU  PP   PP
//       SSSSS   EEEE       TT     UU   UU  PPPPPP
//           SS  EE         TT     UU   UU  PP
//      SSSSSS   EEEEEE     TT      UUUUU   PP
//
void setup() {
  Serial.begin(38400);
  
  // set the buttons as input
  #ifdef VOLUMEPOT
    pinMode(volPotPin, INPUT);       // connects to the potentiometer that shall control the volume
  #endif
  #ifdef BUTTONS
    pinMode(btnLinePin, INPUT);      // connects to the 4 buttons with different resistors (set the value down in function playTrack())
  #endif
  #ifdef LOWBAT
    pinMode(lowBatPin, INPUT);     // connects to the LBO pin of the Adafruit PowerBoost 1000c
  #endif
  #ifdef IRREMOTE
    pinMode(iRRemotePin, INPUT);     // connects to the output port of the remote control (decoded values for each button in function playTrack())
  #endif
  
  // and the leds as output
  #ifdef OPRLIGHT
    pinMode(infoLedPin, OUTPUT);     // connect to blue LED
  #endif
  pinMode(warnLedPin, OUTPUT);     // connect to orange LED
  pinMode(errorLedPin, OUTPUT);    // connect to a red LED

  // initialize the music player
  if (! musicPlayer.begin()) {
    Serial.println(F("VS1053 Not found"));

    // flash the red light to indicate we have an error
    for (;;) { digitalWrite(errorLedPin, HIGH); }
  }
  // initialize the SD card
  if (!SD.begin(CARDCS)) {
    Serial.println(F("SD-Card Not found"));

    // flash the red light to indicate we have an error
    for (;;) { digitalWrite(errorLedPin, HIGH); }
  }
  
  
  // This option uses a pin interrupt. No timers required! But DREQ
  // must be on an interrupt pin. For Uno/Duemilanove/Diecimilla
  // that's Digital #2 or #3
  // See http://arduino.cc/en/Reference/attachInterrupt for other pins
  if (! musicPlayer.useInterrupt(VS1053_FILEPLAYER_PIN_INT)) {
    Serial.println(F("No interrupt on DREQ pin"));
    for (;;) { digitalWrite(errorLedPin, HIGH); }
  }

  // WELCOME SOUND
  #ifdef VOLUMEPOT
    plrAdjustVolume();            // initiallly adjust volume
  #endif
  if (playTrack(1) == -1) {  // play the welcome sound
    issueWarning("HELLO error", "", false);
  }
  
  
  // now as the last thing, start the nfc reader either the simple one with NDEF support
  #ifdef NFCNDEF
    nfc.begin();
  #endif

  // or the one which allows for resume and rescan etc. but needs the trackDB as no NDEF messages are supported
  #ifdef NFCTRACKDB
  
  #endif
  
  // ALL DONE
  delay(100); // wait some time for everything to settle
  #ifdef OPRLIGHT
    digitalWrite(infoLedPin, LOW); // turn off the info led
    delay(100); // wait some time for everything to settle
    digitalWrite(infoLedPin, HIGH); // turn off the info led
    delay(100); // wait some time for everything to settle
    digitalWrite(infoLedPin, LOW); // turn off the info led
    delay(100); // wait some time for everything to settle
    digitalWrite(infoLedPin, HIGH); // turn off the info led
    delay(100); // wait some time for everything to settle
    digitalWrite(infoLedPin, LOW); // turn off the info led
  #endif
  
  // check our current time, so we know when to stop
  //startUpTime = millis();
  #ifdef DEBUG
    Serial.print(F("Fairytale V"));Serial.print(VERSION);Serial.print(F(" - waiting "));
  #endif
}


//
//        LL       OOOOOO    OOOOOO   PPPPPPP
//        LL      OO    OO  OO    OO  PP    PP
//        LL      OO    OO  OO    OO  PPPPPPP
//        LL      OO    OO  OO    OO  PP
//        LLLLLL   OOOOOO    OOOOOO   PP
//
void loop() {
  boolean weHaveATag = false;              // is set to true if a tag is present and false, if not
  boolean resumeLast = false;              // is set to true if the pause button is pressed without a tag
  boolean loopWarningMessageNoAlbumInfos = true;  // make sure we get the "no album info on tag" message at least once
  boolean loopWarningMessageNoFilesInDir = true;  // make sure we get the "no files in dir" message at least once

  // this allows for the pause/resume button to be pressed without a tag being present
  // in this case the last played album is resumed
  #ifdef RESUMELAST
    #ifdef BUTTONS
      btnVal = analogRead(btnLinePin);
      if (btnVal > minBtnValue && (millis()-btnPressTime) > btnPressDelay) { 
        if ( ((btnVal - btnValDrift) < btnPauseValue) && ((btnVal + btnValDrift) > btnPauseValue) ) { 
          #ifdef DEBUG
            Serial.println(F("Pause Button Pressed"));
          #endif
        }
      }
    #endif
  #endif
  
  #ifdef DEBUG 
    Serial.print(F("."));
  #endif

  // if a tag is found, we continue
  weHaveATag = nfc.tagPresent(1000);
  if (weHaveATag) {
    #ifdef DEBUG
      Serial.println(F(" tag found!"));
    #endif
    
    // read data from tag: directory, track number and playing order.
    if (!getDirAndTrackToPlay(weHaveATag)) {
      // if we don't get at least a directory we can't start playback and inform the user
      if (loopWarningMessageNoAlbumInfos) {
        loopWarningMessageNoAlbumInfos = false;
        issueWarning("no album info", "/system00/nodirtag.mp3", true);
      }
    } else {  // we may start playing as it seems
      // now let's get the number of files in the album directory
      const byte numberOfFiles = countFiles(SD.open(plrCurrentFolder));
      
      // there is no file in the folder indicate this as a minor error
      if (numberOfFiles < 1) {
        if (loopWarningMessageNoFilesInDir) {
          loopWarningMessageNoFilesInDir  = false; // set loop warning message so we don't show this warning in the next loop
          issueWarning("no files found", "/system00/nofilesd.mp3", true);
        }
      } else {
        char retVal = playAlbum(numberOfFiles);
        retVal = nextTrackToPlay;
        if (retVal < 0) { 
          issueWarning("playback failed", "/system00/playfail.mp3", true);
        } else {  
          #ifdef DEBUG
            Serial.println(F("\nplayback end"));
          #endif
          digitalWrite(warnLedPin, LOW);
        }
      } // end of check if at least 1 file was found
    } // end of directory plus track retrieved from nfc tag
    
    // finally turn off the info led
    #ifdef OPRLIGHT
      if (lightOn) digitalWrite(infoLedPin, LOW);
    #endif
  } // end of tag is present
  
  delay(1000); // throttle the loop for 1 second
  // check if the battery is still good
  #ifdef LOWBAT
    if (digitalRead(lowBatPin == LOW)) {
      if (lowBatWarn && (millis()-lightStartUpTime > 300000)) {
        digitalWrite(errorLedPin, HIGH);
        issueWarning("BATTERY LOW", "/system00/lowbat01.mp3", true);
        lowBatWarn = false;
        lightStartUpTime = millis();
      }
    }
  #endif
} // end of loop




//
//        VV      VV   OOOOOO   LL
//         VV    VV   OO    OO  LL
//          VV  VV    OO    OO  LL
//           VVVV     OO    OO  LL
//            VV       OOOOOO   LLLLLL  
//
//  BELOW THIS LINE THE MP3 PLAYER CONTROL IS DEFINED
//
// included in while loop during playback to check for volume changes
#ifdef VOLUMEPOT
static void plrAdjustVolume() {
  // volume control functions
  const byte volSensorDrift = 7;    // difference to last received sensor value that must be exceeded to activate a change in the volume
  word volCompareValue      = 0;    // just a convenience variable to make comparison easier
  //byte soundVolume         = 0;    // the sound volume is derived via a map function from the sensor value

  // read the input on analog pin 0 and check if we have a change in volume.
  const word volSensorValue = analogRead(volPotPin);
  if (lastVolSensorValue > volSensorValue) {
    volCompareValue = lastVolSensorValue - volSensorValue;
  } else {
    volCompareValue = volSensorValue - lastVolSensorValue;
  }
  
  // If we have a high enough difference in the sensor reading, calculate it so we may set it on the player
  if (volCompareValue > volSensorDrift) {
    #ifdef DEBUG
      //Serial.print(F("changing volume: "));
    #endif
    const byte soundVolume = volSensorValue / 10; // map the sensor value to a sound volume
    #ifdef DEBUG
      Serial.print(F("old sensor: ")); Serial.print(lastVolSensorValue); Serial.print(F(", new sensor: ")); Serial.print(volSensorValue); Serial.print(F(", vol: ")); Serial.println(soundVolume);
    #endif
    lastVolSensorValue = volSensorValue;
    musicPlayer.setVolume(soundVolume, soundVolume);
  } // end of change sound volume
}
#endif

//
//        MM      MM   PPPPPP   33333
//        MMMM  MMMM  PP    PP      33
//        MM  MM  MM  PP    PP    3333
//        MM      MM  PPPPPP        33
//        MM      MM  PP        33333
//
//  BELOW THIS LINE THE MP3 PLAYER CONTROL IS DEFINED
//
// stop playback
static void plrStop(void) {
  #ifdef DEBUG
    //Serial.println(F("Stopping playback"));
  #endif
  musicPlayer.stopPlaying();
}

// toggle pause
static void plrTogglePause(void) {
  if (!musicPlayer.paused()) {
    #ifdef DEBUG
      Serial.println(F("  playback pause"));
    #endif
    musicPlayer.pausePlaying(true);
  } else {
    #ifdef DEBUG
      Serial.println(F("  playback resume"));
    #endif
    musicPlayer.pausePlaying(false);
  }
}

static char playAlbum(byte numberOfFiles) {
  boolean loopWarningMessageFileNotFound = true;// make sure   file not found               warning message is shown at least once
  
  #ifdef DEBUG
    Serial.print(F("Folder: ")); Serial.print(plrCurrentFolder); Serial.print(F(" / Files: ")); Serial.println(numberOfFiles);
  #endif
  #ifdef OPRLIGHTTIME
    lightStartUpTime = millis();          // store the time in millis when the  playback-for-loop started, so we can later check, whether or not the light shall continue to be on
  #endif
  for (byte curTrack = firstTrackToPlay; curTrack <= numberOfFiles; curTrack++) {
    digitalWrite(warnLedPin, LOW); // in each for-loop, we make sure that the warning LED is NOT lit up
    #ifdef DEBUG
      Serial.print(F("Track ")); Serial.print(curTrack); Serial.print(F("/")); Serial.print(numberOfFiles);Serial.println(F(": "));
    #endif
    
    if (!setFileNameToPlay(curTrack)) {
      // created filename does not exit on SD card :-(
      if (loopWarningMessageFileNotFound) {
        loopWarningMessageFileNotFound = false; // set loop warning message so we don't show this warning in the next loop
        issueWarning("file not found", "/system00/filnotfn.mp3", true);
      }
      break;
    }
    
    // make sure we remember the just started track to be the new track, in case player is stopped
    if (curTrack != firstTrackToPlay) {
      // in case we are on the last track, write the first track to the tag, so we start playback all from the beginning.
      if (curTrack == numberOfFiles) firstTrackToPlay = 1; else firstTrackToPlay = curTrack;
      
      #ifdef DEBUG
        //Serial.print(F("set ")); Serial.print(firstTrackToPlay); Serial.println(F(" as first track to play"));
      #endif
      #ifdef NFCTRACKDB
        if (!writeTrackDbEntry()) {
          issueWarning("trackdb update error", "", false);
        }
      #endif
    }

    // play the track on the music maker shield and retrieve a return value 
    //        -1  errors trying to play the file (like file not found)
    //         0  success - the file was played
    //     1-127  any positive number for the next track to play
    //            from an album standpoint this can also be a previous track on the album to play next
    playTrack(curTrack);
    if (nextTrackToPlay == -1) {
      issueWarning("playback failed", "/system00/playfail.mp3", false);
      break;
    } else if (nextTrackToPlay == 1) {
      curTrack = 1;
    } else {
      curTrack = nextTrackToPlay;
    }
    if (curTrack == numberOfFiles) return(0);
  } // end of loop through files
  return(0);
}

static char playTrack(byte trackNo) {
  #ifdef OPRLIGHTTIME
    const unsigned long maxLightTime = 1800000L;  // how long shall the light stay on while nothing is playing - default 900000 = 15 Minutes
  #endif
  const unsigned int checkInterval = 10000L;    // time in milliseconds between checks for battery status, if the tag ist still present and if the max light time is reached
  /*
  #ifdef BUTTONS
    // the 4 control buttons
    word btnVal;                        // stores the value we receive on the btnLinePin for comparance with the predefined analog reads for the 4 buttons
    const byte btnValDrift   = 5;       // maximum allowed difference + and - the predefined value for each button we allow
    const word btnPressDelay = 500;     // delay in milliseconds to prevent double press detection
    unsigned long btnPressTime = 0;     // time in millis() when the button was pressed
    const word btnLightValue = 1021;    // 33 Ohm  - The value we receive from analog input if the Light On/Off Button is pressed
    const word btnPauseValue = 933;     // 1K Ohm  - The value we receive from analog input if the Pause Button is pressed
    const word btnNextValue  = 1002;    // 220 Ohm - The value we receive from analog input if the Next (aka Fast Forward) Button is pressed
    const word btnPrevValue  = 991;     // 330 Ohm - The value we receive from analog input if the Previos (aka Prev or Rewind) Button is pressed
    const word minBtnValue   = 800;     // we use this value to determine, whether or not to check the buttons. Set to lower val than smallest of buttons
  #endif
  
  #ifdef IRREMOTE
    // IR Remote control
    // to reduce PROGMEM size I decided to not use the whole decimal value for each button on the remote control but instead do a calculation 
    // which reduces the needed size of the variable to hold the value but still creates different values for each button
    // Function  Original code   Minus         DIV   code I use
    // right:    2011291898    - 2011000000) / 100 = 2919
    // left:     2011238650    - 2011000000) / 100 = 2387
    // Up:       2011287802    - 2011000000) / 100 = 2878
    // Down:     2011279610    - 2011000000) / 100 = 2796
    // Middle:   2011282170    - 2011000000) / 100 = 2822
    // Pause:    2011265786    - 2011000000) / 100 = 2658
    // Menu:     2011250938    - 2011000000) / 100 = 2509
    const uint16_t nextVal    = 2919; // decoded value if button  NEXT  is pressed on remote
    const uint16_t prevVal    = 2387; // decoded value if button  PREV  is pressed on remote
    const uint16_t volUpVal   = 2878; // decoded value if button  UP    is pressed on remote
    const uint16_t volDwnVal  = 2796; // decoded value if button  DOWN  is pressed on remote
    const uint16_t lightVal   = 2822; // decoded value if button  HOME  is pressed on remote
    const uint16_t pauseVal   = 2658; // decoded value if button  PAUSE is pressed on remote
    const uint16_t menuVal    = 2509; // decoded value if button  MENU  is pressed on remote
  #endif
  */
  
  if (!musicPlayer.startPlayingFile(filename)) {
    nextTrackToPlay = -1;
    return (nextTrackToPlay);
  }

  unsigned long checkTime = millis();
  //
  //    LETS PLAY THE TRACK
  //
  while (musicPlayer.playingMusic || musicPlayer.paused()) {
    // file is now playing in the 'background' so now's a good time
    // to do something else like handling LEDs or buttons :)
    #ifdef OPRLIGHT 
      // fade the light
      if (lightOn && musicPlayer.paused()) analogWrite(infoLedPin, 5);
      if (lightOn && !musicPlayer.paused()) analogWrite(infoLedPin, 128 + 127 * cos(2 * PI / 20000 * millis()));
    #endif
    
    // every ten seconds we do some checks
    if ((millis()-checkTime) > checkInterval) {
      #ifdef DEBUG
        //Serial.print(checkTime);Serial.println(F("ms played - check LIGHT, NFC and BAT"));
      #endif
      
      // check if we shall still fade the info light - depends on max light time and light startup time and also on the light button state
      #ifdef OPRLIGHTTIME
        if (((millis()-lightStartUpTime) > maxLightTime) && lightOn) {
          #ifdef DEBUG
            //Serial.println(F("Max Light Time reached, turn light off")); 
          #endif
          switchLightState(); 
        }
      #endif
      
      // TODO: check if this really works this way
      // check if the battery is still good
      #ifdef LOWBAT
        if (digitalRead(lowBatPin == LOW)) digitalWrite(errorLedPin, HIGH);
      #endif
      
      // check if we can still read the tag and if not, stop/pause the playback
      #ifdef NFCTRACKDB
        if (!checkTag()) plrTogglePause();
      #endif
      
      checkTime = millis(); // reset checktime so we can wait another 10 seconds aka 10000 ms
    }
    
    // check for changes to volume and adjust accordingly
    #ifdef VOLUMEPOT
      plrAdjustVolume();
    #endif
    
    // check for button presses to pause, play next or previous track or turn lights on/off
    #ifdef BUTTONS
      btnVal = analogRead(btnLinePin);
      if (btnVal > minBtnValue && (millis()-btnPressTime) > btnPressDelay) { 
        btnPressTime = millis(); 
        #ifdef DEBUG
          //Serial.print(F("VALUE: "));Serial.print(btnVal - btnValDrift); Serial.print(F(" < ")); Serial.print(btnVal); Serial.print(F(" < ")); Serial.print(btnVal + btnValDrift);
        #endif
        //
        //       Button Layout on the box:
        //
        //   +-------+  +-------+  +-------+  +-------+
        //   | PAUSE |  | <PREV |  | NEXT> |  | LIGHT |
        //   +-------+  +-------+  +-------+  +-------+
        //
        // PAUSE
        if ( ((btnVal - btnValDrift) < btnPauseValue) && ((btnVal + btnValDrift) > btnPauseValue) ) { 
          #ifdef DEBUG
            Serial.println(F(" - Pause Button Pressed"));
          #endif
          plrTogglePause();
          //musicPlayer.sineTest(0x42, 100);    // Make a tone to indicate button press
        }
  
        // PREV
        if ( ((btnVal - btnValDrift) < btnPrevValue)  && ((btnVal + btnValDrift) > btnPrevValue)  ) { 
          plrStop();
          if (trackNo > 2) nextTrackToPlay = trackNo - 2;
          else nextTrackToPlay = 0;
          #ifdef DEBUG
            Serial.print(F(" - Prev Button Pressed, track "));Serial.print(nextTrackToPlay);Serial.println(F(" set"));
          #endif
          musicPlayer.sineTest(0x42, 100);    // Make a tone to indicate button press
          return(nextTrackToPlay); 
        }
        
        // NEXT
        if ( ((btnVal - btnValDrift) < btnNextValue)  && ((btnVal + btnValDrift) > btnNextValue)  ) { 
          plrStop();
          nextTrackToPlay = trackNo;
          #ifdef DEBUG
            Serial.print(F(" - Next Button Pressed, track "));Serial.print(nextTrackToPlay);Serial.println(F(" set"));
          #endif
          musicPlayer.sineTest(0x42, 100);    // Make a tone to indicate button press
          return(nextTrackToPlay);
        }
        
        // LIGHT
        #ifdef OPRLIGHT
          if ( ((btnVal - btnValDrift) < btnLightValue) && ((btnVal + btnValDrift) > btnLightValue) ) { 
            #ifdef DEBUG
              Serial.println(F(" - Light Button Pressed")); 
            #endif
            switchLightState();
            //musicPlayer.sineTest(0x40, 100);    // Make a tone to indicate button press
          }
        #endif
      }
    #endif

    #ifdef IRREMOTE
      // IR Remote Control
      //               +-------+
      //               |  UP   |
      //               +-------+
      //    +-------+  +-------+  +-------+
      //    | LEFT  |  | HOME  |  | RIGHT |
      //    +-------+  +-------+  +-------+
      //               +-------+
      //               | DOWN  |
      //               +-------+
      //      +-------+        +-------+  
      //      | PAUSE |        |  MENU |
      //      +-------+        +-------+
      // chek for IR Remote Control action
      if (irrecv.decode(&results)) { // get data from IR Remote
        switch ((results.value-2011000000)/100) {
          // PREV
          case prevVal:
            #ifdef DEBUG
              Serial.print(F(" - Prev Button Pressed, track "));Serial.print(nextTrackToPlay);Serial.println(F(" set"));
            #endif
            plrStop();
            musicPlayer.sineTest(0x42, 100);    // Make a tone to indicate button press
            if (trackNo > 2) nextTrackToPlay = trackNo - 2; else nextTrackToPlay = 0;
            return(nextTrackToPlay); 
            break;
          // NEXT
          case nextVal:
            #ifdef DEBUG
              Serial.print(F(" - Next Button Pressed, track "));Serial.print(nextTrackToPlay);Serial.println(F(" set"));
            #endif
            plrStop();
            musicPlayer.sineTest(0x42, 100);    // Make a tone to indicate button press
            nextTrackToPlay = trackNo;
            return(nextTrackToPlay);
            break;
          // PAUSE
          case pauseVal:
            #ifdef DEBUG
              Serial.println(F(" - Pause Button Pressed"));
            #endif
            plrTogglePause();
            break;
          // LIGHT
          #ifdef OPRLIGHT
            case lightVal:
              #ifdef DEBUG
                Serial.println(F(" - Light Button Pressed")); 
              #endif
              switchLightState();
              break;
          #endif
          // VOL UP
          case volUpVal:
            #ifdef DEBUG
              Serial.println(F(" - Volume Up Button Pressed"));
            #endif
            break;
          // VOL DOWN
          case volDwnVal:
            #ifdef DEBUG
              Serial.println(F(" - Volume Down Button Pressed"));
            #endif
            break;
          // MENU
          // CURRENTLY NO FUNCTION FOR MENU
          //case menuVal:
          //  #ifdef DEBUG
          //    Serial.println(F(" - Menu Button Pressed"));
          //  #endif
          //  break;
          default:
            break;
        }  
        delay(50);
        irrecv.resume(); 
      }
    #endif
    
    // check if the player is still playing our sounds and is NOT paused - otherwise we return a 0 to indicate successfull end of playback
    if (!musicPlayer.playingMusic && !musicPlayer.paused()) { nextTrackToPlay = trackNo; return (nextTrackToPlay); }
  } // end of while playing music
  
  nextTrackToPlay = trackNo;
  return (nextTrackToPlay);
}

//
//      TTTTTTTTTT  RRRRRR       AA       CCCCC  KK   KK  DDDDDD    BBBBBB
//          TT      RR   RR     AAAA     CC      KK KK    DD    DD  BB    BB
//          TT      RRRRRR     AA  AA    CC      KKKK     DD    DD  BBBBBB
//          TT      RR   RR   AAAAAAAA   CC      KK KK    DD    DD  BB    BB
//          TT      RR   RR  AA      AA   CCCCC  KK   KK  DDDDDD    BBBBBB
//
// sets the directpry to play (plrCurrentFolder) and the track to start playback with (firstTrackToPlay)
static boolean getDirAndTrackToPlay(boolean readFromTag) {
  boolean plrStartPlaying = false;

  if (readFromTag) {
    #ifdef NFCNDEF
      // GET ALBUM DIRECTORY TO PLAY FROM TAG NDEF MESSAGES
      NfcTag tag = nfc.read();
      #ifdef DEBUG
        Serial.print(F("Tag Type: ")); Serial.println(tag.getTagType()); Serial.print(F("UID: ")); Serial.println(tag.getUidString());
      #endif
    
      if (tag.hasNdefMessage()) {
        NdefMessage message = tag.getNdefMessage();
    
        // If you have more than 1 Message then it will cycle through them
        for (byte i = 0; i < message.getRecordCount(); i++) {
          NdefRecord record = message.getRecord(i);
    
          byte payloadLength = record.getPayloadLength();   // get length of record
          byte payload[payloadLength];                // initialise payload variable to store content of record
          record.getPayload(payload);                 // extract the payload of this record
          char* p;                                    // this is where we store the result of strtok()
          
          p = strtok((char *)payload, " ");           // separate payload on space-delimiter as it's form is like this:  en bluemc99   or equivalent
          p = strtok(NULL, " ");                      // we only need the second entry and strtok() expects NULL for string on subsequent calls
          switch (i) {
            case 0:
              plrStartPlaying = true;
              memset(plrCurrentFolder, 0, sizeof(plrCurrentFolder));
              memcpy(plrCurrentFolder, p, 8);         // copy directory from tag into global player var - so we know which dir to play files from
              break;
            case 1:
              byte i;
              i = atoi(p);
              firstTrackToPlay = i;                   // copy track number to firstTrackToPlay - so we know where to start the playback
              break;
            default:
              break;
          }
        }
        //return (plrStartPlaying);
      }
    #endif
    #ifdef NFCTRACKDB
      // GET ALBUM DIRECTORY TO PLAY FROM TRACKDB
    #endif
  } else {
    // GET FROM LAST PLAYED SESSION FILE
  }
  return (plrStartPlaying);
}


// write the created trackDbEntry into the Track DB on SD
#ifdef NFCTRACKDB
static boolean writeTrackDbEntry() {
  boolean success = true;
  byte bytesWritten;
  
  #ifdef DEBUG
    Serial.print(F("saving nfc <-> album: "));Serial.println(trackDbEntry);
  #endif
  /*
  // FIRST write the trackDbFile --> ALBUMNFC.TXT
  File file = SD.open(trackDbFile, FILE_WRITE);
  bytesWritten = file.write(trackDbEntry, sizeof(trackDbEntry));
  file.close();                                   // and make sure everything is clean and save
  if (bytesWritten == sizeof(trackDbEntry)) {
    #ifdef DEBUG
      Serial.print(F(" ok. wrote "));Serial.print(bytesWritten);Serial.print(F(" byte(s) to "));Serial.println(trackDbFile);
    #endif
    success = true; 
  } else {
    Serial.print(F("  error writing "));Serial.println(trackDbFile);
  }
  
  // SECOND write the tDirFile --> e.g. larsrent.txt
  memset(tDirFile, 0, sizeof(tDirFile));          // make sure var to hold path to track db file is empty
  strcat(tDirFile, trackDbDir);                   // add the trackDb Directory to the 
  strcat(tDirFile, "/");                          // a / 
  strcat(tDirFile, plrCurrentFolder);             // and the filename
  strcat(tDirFile, ".txt");                       // plus of course a txt extension
  SD.remove(tDirFile);                            // we want the file to be empty prior writing directory and track to it, so we remove it
  File file = SD.open(tDirFile, FILE_WRITE);      // and now we open / create it
  bytesWritten = file.write(trackDbEntry, sizeof(trackDbEntry));
  file.close();                                   // and make sure everything is clean and save
  if (bytesWritten == sizeof(trackDbEntry)) {
    #ifdef DEBUG
      Serial.print(F(" ok. wrote "));Serial.print(bytesWritten);Serial.print(F(" byte(s) to "));Serial.println(tDirFile);
    #endif
    success = false;
  } else {
    Serial.print(F("  error writing "));Serial.println(tDirFile);
    success = false;
  }
  */
  return (success);
}
#endif 


// 
//      NN    NN  FFFFFF  CCCCC
//      NNN   NN  FF     CC
//      NN NN NN  FFFF   CC
//      NN   NNN  FF     CC
//      NN    NN  FF      CCCCC
//
// check Tag presence is used in the loop() (to populate the char array with the uid of the tag) and in function playTrack() to see
// if the tag is still on the reader - this can only be used with the Adafruit NFC library
#ifdef NFCTRACKDB
boolean checkTag() {
  boolean sameTagPresent = true;

  return(sameTagPresent);
}
#endif

// 
//      HH    HH  EEEEEE  LL      PPPPPP    EEEEEE  RRRRRR
//      HH    HH  EE      LL      PP    PP  EE      RR   RR
//      HHHHHHHH  EEEE    LL      PPPPPPP   EEEE    RRRRR
//      HH    HH  EE      LL      PP        EE      RR   RR
//      HH    HH  EEEEEE  LLLLLL  PP        EEEEEE  RR   RR
//
// stores the file to play in the global var filename - it is created from the gloal vars plrCurrentFolder and current track
static boolean setFileNameToPlay(byte trackNo) {
  // convert the trackNo to a char array - we need it next to create the filename of the track
  char curTrackCharNumber[4];
  sprintf(curTrackCharNumber, "%03d", trackNo);
  
  // create the filename of the track to play, including path, so we can feed it to the music player
  strcpy(filename, "");
  strcat(filename, "/");
  strcat(filename, plrCurrentFolder);
  strcat(filename, "/");
  strcat(filename, "track");
  strcat(filename, curTrackCharNumber);
  strcat(filename, ".mp3");
  
  // return true or false for the filename created - this is checked
  return (SD.exists(filename));
}


// store uid, plrCurrentFolder and firstTrackToPlay in the char array trackDbEntry[]
// so we may write it to the track Db file
#ifdef NFCTRACKDB
static void setTrackDbEntry() {
  char tmpbuf[4];                                 // temp buffer for one number of the uid
  memset(trackDbEntry, 0, sizeof(trackDbEntry));
    
  // create the entry for the  "Tag UID <-> directory + track number"  connection
  memset(trackDbEntry, 0, sizeof(trackDbEntry));
  for (byte i = 0; i <= uidLength ; i++) {
    sprintf( tmpbuf, "%d", uid[i] );              // print one byte of the uid as decimal into tmpbuf, so
    strcat( charUid, tmpbuf );                    // we can add it to the charUid 
  }
  
  memcpy(trackDbEntry, charUid, sizeof(charUid)); // finally we add the charUid to the trackDbENtry 
  strcat(trackDbEntry, ":");                      // add a seperator :
  strcat(trackDbEntry, plrCurrentFolder);         // the folder of the album this tag is connected with
  char cstr[4];                                   // a new char array that will hold firstTrackToPlay as a char array
  itoa(firstTrackToPlay, cstr, 10);               // converting firstTrackToPlay to char and place it in cstr
  strcat(trackDbEntry, ":");                      // and the number of the track
  strcat(trackDbEntry, cstr);                     // and the number of the track
  strcat(trackDbEntry, "\n");                     // and a newline :-)
}
#endif

//
//        FFFFFF  II  LL      EEEEEE
//        FF      II  LL      EE
//        FFFF    II  LL      EEEE
//        FF      II  LL      EE
//        FF      II  LLLLLL  EEEEEE
//
// BELOW THIS LINE THE FILE HELPER FUNCTIONS CAN BE FOUND
//
// counts the number of files in directory
static byte countFiles(File dir) {
  byte counter = 0;
  while (true) {
    File entry = dir.openNextFile();
    // Skip directories and hidden files.
    //if (!entry.isSubDir() && !entry.isHidden()) {
    if (!entry) {
      // no more files
      break;
    }
    counter++;
    entry.close();
    //}
  }
  dir.close();
  return (counter);
}


//
//        WW            WW    AA      RRRRRR    NNNN    NN
//         WW    WW    WW    AAAA     RR   RR   NN NN   NN
//          WW  WWWW  WW    AA  AA    RR    RR  NN  NN  NN
//           WWWW  WWWW    AAAAAAAA   RRRRRRR   NN   NN NN
//            WW    WW    AA      AA  RR    RR  NN    NNNN
//
static void issueWarning(const char msg[20], const char filename[23], boolean voiceOutput) {
  #ifdef DEBUG
    Serial.println(msg);
  #endif
  if (voiceOutput && SD.exists(filename)) {
    musicPlayer.playFullFile(filename);
  } /*else {
    musicPlayer.sineTest(0x30, 200);    // Make a tone to indicate warning
  }*/
  digitalWrite(warnLedPin, HIGH);
}

//
//  LL      EEEEEE  DDDDDD
//  LL      EE      DD   DD
//  LL      EEEE    DD   DD
//  LL      EE      DD   DD
//  LLLLLL  EEEEEE  DDDDDD
//
// switches the value of lightOn between true and false
#ifdef OPRLIGHT
static void switchLightState(void) {
  if (!lightOn) {
    #ifdef DEBUG
      Serial.println(F("Switching light off -> ON"));
    #endif
    lightOn = true;
    #ifdef OPRLIGHTTIME
      lightStartUpTime = millis(); // also sets the lightStartUpTime
    #endif
  } else {
    #ifdef DEBUG
      Serial.println(F("Switching light on -> OFF"));
    #endif
    lightOn = false;
    digitalWrite(infoLedPin, LOW);   // also turns off the info led
  }
}
#endif
