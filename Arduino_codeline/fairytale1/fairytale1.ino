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

   - ledPin             5  the pin to which the operation led is connected to
   - warnPin            8  the pin to which the warning led is connected to
   - errorPin           9  the pin to which the error led is connected to (e.g. used for LBO of powerboost 1000c)
    

   - volumePotPin      A0  the analog input pin that we use for the potentiometer
   - btnLinePin        A1  pin to which the button line (4 buttons) is connected to
   - batLowInputPin    A2  the pin on which the powerboost 1000c indicates a low baterry (LBO) - ouput done via errorPin
   - programming       A3  the pin the program button is connected to. The program button changes the functionality
                           of the overall program in that (if pressed) the code will register a new tag for use with 
                           an album directory currently not connected to a tag (functionality yet to come)
*/

// make sure to change this to false before uploading in production as it turns on lots and lots of serial messages
// you may also do a find and replace    if (DEBUG)    with    // if (DEBUG)    to reduce memory impact on arduino
boolean DEBUG = true;


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
#include <PN532_SPI.h>
#include <PN532.h>
#include <NfcAdapter.h>
#define PN532_SCK     13    // SPI Clock shared with VS1053, SD card and NFC breakout board 
#define PN532_MISO    12    // Input data from VS1053, SD card and NFC breakout board 
#define PN532_MOSI    11    // Output data to VS1053, SD card and NFC breakout board 
#define PN532_SS      10    // NFC breakout board chip select pin
PN532_SPI pn532spi(SPI, PN532_SS);
NfcAdapter nfc = NfcAdapter(pn532spi);


//       VV       VV   Y       RRRRR
//        VV     VV   AAA     RR   RR
//         VV   VV   AA AA    RRRRRR
//          VV VV   AAAAAAA   RR   RR
//            V    AA     AA  RR   RR
//

// uptime counters
unsigned long startUpTime        = 0;         // millis() the Arduino is started
const unsigned long maxUpTime    = 1800000L;  // how long will the system stay on while nothing is playing - default 1800000 = 30 Minutes
unsigned long lightStartUpTime   = 0;         // millis() the operations light started
const unsigned long maxLightTime = 1800000L;  // how long shall the light stay on while nothing is playing - default 900000 = 15 Minutes
const unsigned long checkInterval= 10000L;    // time in milliseconds between checks for battery status, if the tag ist still present and if the max light time is reached

// booleans to chose whether or not to show continuing warning messages in the loop
boolean loopWarningMessageNoFilesInDir = true;// make sure   no files in directory found  warning message is shown at least once
boolean loopWarningMessageFileNotFound = true;// make sure   file not found               warning message is shown at least once
boolean loopWarningMessageNoAlbumInfos = true;// make sure   no album info on nfc tag     warning message is shown at least once


// mp3 player variables
char plrCurrentFile[13]     = "track001.mp3";           // filename of currently played track - we start with the welcome track
char plrCurrentFolder[9]    = "system00";               // directory containing the currently played tracks - system00 is the system message directory
char filename[23]           = "/system00/track001.mp3"; // path and filename of the track to play - we start with the welcome track
byte firstTrackToPlay       = 1;                        // the track number to play (used for the loop)


// trackDb on the SD card - this is where we store the NFC TAG <-> Directory connection and the track to start playback with
char trackDbDir[10]      = "/trackdb0";              // where do we store the files for each album 
char trackDbFile[23]     = "/trackdb0/albumnfc.txt"; // path to the file that holds the connection between an NFC tag UID and the corresponding directory / file name
char tDirFile[23];                                   // a char array to hold the path to the file with track and directory infos (name is shared with directory name plus .txt
char trackDbEntry[35];                               // will hold a nfc <-> album info connection in the form of [NFC Tag UID]:[album]:[Track] e.g.: 43322634231761291:larsrent:1


// NFC Tag data
byte uid[] = { 0, 0, 0, 0, 0, 0, 0 };    // Buffer to store the returned UID
char charUid[22];                        // char representation of the UID
byte uidLength;                          // Length of the UID (4 or 7 bytes depending on ISO14443A card type)
boolean weHaveATag = false;              // is set to true if a tag is present and false, if not


// volume control variables for the analog poti
const byte volumePotPin = A0;      // the analog input pin that we use for the potentiometer
const byte sensorDrift  = 7;       // difference to last received sensor value that must be exceeded to activate a change in the volume
word compareValue       = 0;       // just a convenience variable to make comparison easier
word sensorValue        = 0;       // read the value from the potentiometer
word lastSensorValue    = 0;       // keeps the last read sensor value
byte soundVolume        = 0;       // the sound volume is derived via a map function from the sensor value


// other button settings
const byte batLowPin    = A2;      // pulled high to BAT but when the charger detects a low voltage (under 3.2V) the pin will drop down to 0V
const byte btnLinePin   = A1;      // pin on which the button line (4 buttons) is connected
const byte btnValDrift  = 20;      // maximum allowed difference + and - the predefined value for each button we allow
byte btnVal;                       // stores the value we receive on the btnLinePin for comparance with the predefined analog reads for the 4 buttons
const word btnLight     = 33;      // The value we receive from analog input if the Light On/Off Button is pressed
const word btnPause     = 66;      // The value we receive from analog input if the Pause Button is pressed
const word btnNext      = 128;     // The value we receive from analog input if the Next (aka Fast Forward) Button is pressed
const word btnPrev      = 230;     // The value we receive from analog input if the Previos (aka Prev or Rewind) Button is pressed

// LIGHT EFFECTS
const byte ledPin         = 5;      // the pin to which the operation led is connected to
const byte warnPin        = 8;      // the pin to which the warning led is connected to
const byte errorPin       = 9;      // the pin to which the error led is connected to
const byte batLowInputPin = 1;      // the pin to which the powerboost 1000c indicates a low baterry (ouput via errorPin)
boolean lightOn           = true;   // if true, the operations light fader is active. is set to false via a button, or after a maxLightTime (see below) is reached
boolean batLow            = false;  // this is set to true by the Adafruit PowerBoost 1000c in case the battery is low


//
//        PPPPPP    RRRRR     OOOOOO   TTTTTTTT   OOOOOO   TTTTTTTT  YY    YY   PPPPPP    EEEEE   SSSSS
//       PP    PP  RR    RR  OO    OO     TT     OO    OO     TT      YY  YY   PP    PP  EE      SS
//       PPPPPPP   RRRRRRR  OO      OO    TT     OO    OO     TT       YYYY    PPPPPPP   EEEE     SSSSS
//       PP        RR    RR  OO    OO     TT     OO    OO     TT        YY     PP        EE          SS
//       PP        RR    RR   OOOOOO      TT      OOOOOO      TT        YY     PP        EEEEEE  SSSSS
//
// these are the prototypes to retrieve and set directory and track to play - aka work on the tagdb
boolean getDirAndTrackToPlay(void);     // retrieve the directory and track number for the Tag placed on the reader
//boolean writeNfcCardData(void);         // write the currently played track to the nfc tag, so we can start from there next time and return true for success and false in case of an error
boolean writeTrackDbEntry(void);        // store Tag UID, plrCurrentFolder and firstTrackToPlay in the trackDb (files on SD)

// these are the prototypes for the mp3 player controller
byte getVolume(void);             // function that returns the volume setting based on the analog read
void plrAdjustVolume(void);       // function to check for changes on the volume control and adjust volume accrodingly
void plrStop(void);               // stops the player and return 0
void plrTogglePause(void);        // pause and unpause the player and return 0
char playTrack(byte);             // plays a track as defined by the global vars: returns -1 for error, 0 for success and track number to play next


// prototype for warning
void issueWarning(byte, const char[], boolean); // show the message provided, activate warning light and voice warning (if boolean is true) 


// these are the prototypes to work on files and general helpers
//void printDirectory(File, byte);  // print out the content of specified directory on serial console
byte countFiles(File);              // return the number of files in a directory passed as a File descriptor

// helper functions to set global vars
boolean setFileNameToPlay(byte);    // sets filename of the track to play from global vars plrCurrentFolder and plrCurrentFile and returns true if it exists
void setTrackDbEntry(void);


// these are the prototypes for the led info
void dimLight(void);                // turn the operations light on on a very low level and the two other lights off
void switchLightState(void);           // switch the boolean var lightOn from true to false and vice versa - in case light is lightOn is set to true, lightStartUpTime is set to millis()
//void infoLed(void);                 // smooth dimming based on millis() during playback - command directly in playback loop now
void errorLed(void);                // rapid flashing of error led
void warnLed(void);                 // up and down dimming of the warning led


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
  pinMode(volumePotPin, INPUT); // connect to the potentiometer
  pinMode(btnLinePin, INPUT);   // connect to the 4 buttons with different resistors (set the value above in global section)
  pinMode(batLowPin, INPUT);    // connect to the LBO pin of the Adafruit PowerBoost 1000c

  // and the leds as output
  pinMode(ledPin, OUTPUT);      // connect to blue LED
  pinMode(warnPin, OUTPUT);     // connect to orange LED
  pinMode(errorPin, OUTPUT);    // connect to a red LED

  // initialize the music player
  if (! musicPlayer.begin()) {
    Serial.println(F("VS1053 Not found"));

    // flash the red light to indicate we have an error
    while (1) { errorLed(); }
  }
  // initialize the SD card
  if (!SD.begin(CARDCS)) {
    Serial.println(F("SD-Card Not found"));

    // flash the red light to indicate we have an error
    while (1) { errorLed(); }
  }
  
  
  // This option uses a pin interrupt. No timers required! But DREQ
  // must be on an interrupt pin. For Uno/Duemilanove/Diecimilla
  // that's Digital #2 or #3
  // See http://arduino.cc/en/Reference/attachInterrupt for other pins
  if (! musicPlayer.useInterrupt(VS1053_FILEPLAYER_PIN_INT)) {
    Serial.println(F("No interrupt on DREQ pin"));
    while (1) { errorLed(); }
  }

  // WELCOME SOUND
  plrAdjustVolume();              // initiallly adjust volume
  if (playTrack(1) == -1) {       // play the welcome sound
    issueWarning(3, "Error playing hello", false);
  }
  
  
  // now as the last thing, start the nfc reader
  nfc.begin();
  
  
  // ALL DONE
  delay(100); // wait some time for everything to settle
  digitalWrite(ledPin, LOW); // turn off the info led
  delay(100); // wait some time for everything to settle
  digitalWrite(ledPin, HIGH); // turn off the info led
  delay(100); // wait some time for everything to settle
  digitalWrite(ledPin, LOW); // turn off the info led
  delay(100); // wait some time for everything to settle
  digitalWrite(ledPin, HIGH); // turn off the info led
  delay(100); // wait some time for everything to settle
  digitalWrite(ledPin, LOW); // turn off the info led
  
  // check our current time, so we know when to stop
  startUpTime = millis();
  if (DEBUG) Serial.print(F("place tag on reader "));
}


//
//        LL       OOOOOO    OOOOOO   PPPPPPP
//        LL      OO    OO  OO    OO  PP    PP
//        LL      OO    OO  OO    OO  PPPPPPP
//        LL      OO    OO  OO    OO  PP
//        LLLLLL   OOOOOO    OOOOOO   PP
//
void loop() {
  if (((millis()-lightStartUpTime) > maxLightTime) && lightOn) { 
    if (DEBUG) Serial.println(F("Max Light Time reached, turn light off")); 
    switchLightState(); 
  }
  if (DEBUG) Serial.print(F("."));

  // if a tag is found, we continue
  weHaveATag = nfc.tagPresent(1000);
  if (weHaveATag) { 
    // on startup, make sure all leds are off
    dimLight(); 
                        
    if (DEBUG) Serial.println(F(" tag found!"));
    loopWarningMessageNoAlbumInfos = true;  // make sure we get the "no album info on tag" message at least once
    loopWarningMessageNoFilesInDir = true;  // make sure we get the "no files in dir" message at least once
    
    // read data from tag: directory, track number and playing order.
    if (!getDirAndTrackToPlay()) {
      // if we don't get at least a directory we can't start playback and inform the user
      if (loopWarningMessageNoAlbumInfos) {
        loopWarningMessageNoAlbumInfos = false;
        issueWarning(2, "no directory on tag", true);
      }
    } else {  // we may start playing as it seems
      // now let's get the number of files in the album directory
      const byte numberOfFiles = countFiles(SD.open(plrCurrentFolder));
      
      // there is no file in the folder indicate this as a minor error
      if (numberOfFiles < 1) {
        if (loopWarningMessageNoFilesInDir) {
          loopWarningMessageNoFilesInDir  = false; // set loop warning message so we don't show this warning in the next loop
          issueWarning(4, "no files in folder", true);
        }
      } else {
        //printDirectory(SD.open(plrCurrentFolder), 1); }
        if (DEBUG) { Serial.print(F("Folder: ")); Serial.print(plrCurrentFolder); Serial.print(F(" / Files: ")); Serial.println(numberOfFiles);} 
        
        lightStartUpTime = millis();          // store the time in millis when the  playback-for-loop started, so we can later check, whether or not the light shall continue to be on
        for (byte curTrack = firstTrackToPlay; curTrack <= numberOfFiles; curTrack++) {
          digitalWrite(warnPin, LOW); // in each for-loop, we make sure that the warning LED is NOT lit up
          
          if (!setFileNameToPlay(curTrack)) {
            // created filename does not exit on SD card :-(
            if (loopWarningMessageFileNotFound) {
              loopWarningMessageFileNotFound = false; // set loop warning message so we don't show this warning in the next loop
              issueWarning(5, "file not found", true);
            }
            break;
          }
          if (DEBUG) { Serial.print(F("Track ")); Serial.print(curTrack); Serial.print(F("/")); Serial.print(numberOfFiles);Serial.print(F(": "));Serial.println(filename); }
          
          // make sure we remember the just started track to be the new track, in case player is stopped
          if (curTrack != firstTrackToPlay) {
            // in case we are on the last track, write the first track to the tag, so we start playback all from the beginning.
            if (curTrack == numberOfFiles) firstTrackToPlay = 1; else firstTrackToPlay = curTrack;
            
            //if (DEBUG) { Serial.print(F("Writing ")); Serial.print(firstTrackToPlay); Serial.println(F(" as first track to play on tag")); }
            if (!writeTrackDbEntry()) {
              issueWarning(7, "error writing tag", false);
            }
          }
  
          // play the track on the music maker shield and retrieve a return value 
          //        -1  errors trying to play the file (like file not found)
          //         0  success - the file was played
          //     1-127  any positive number for the next track to play
          //            from an album standpoint this can also be a previous track on the album to play next
          char retVal = playTrack(curTrack);
          if (retVal == -1) {
            loopWarningMessageFileNotFound = false; // set loop warning message so we don't show this warning in the next loop
            issueWarning(6, "playback failed", true);
          } else {
            // end of was playback successfull - in case the light was on, turn it off now
            if (retVal == 0) { if (lightOn) switchLightState(); } 
          }
          if (!musicPlayer.paused()) { if (lightOn) analogWrite(ledPin, 5); }
        } // end of loop through files - turn off light
        if (lightOn) digitalWrite(ledPin, LOW);
      } // end of check if at least 1 file was found
      
      if (DEBUG) { Serial.println(F("end of playback")); }
    } // end of directory plus track retrieved from nfc tag
  } // end of tag is present
  
  weHaveATag = false;
  loopWarningMessageNoFilesInDir = true; // reset all loop warning messages so we can reuse it for the next album
  loopWarningMessageFileNotFound = true;
  loopWarningMessageNoAlbumInfos = true;
  
  delay(1000); // throttle the loop for 1 second
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
byte getVolume() {
  //soundVolume = map(sensorValue, 0, 1023, 0, 100); // map the sensor value to a sound volume
  soundVolume = sensorValue / 10; // map the sensor value to a sound volume
  if (DEBUG) { Serial.print(F("last sensor: ")); Serial.print(lastSensorValue); Serial.print(F(", new sensor: ")); Serial.print(sensorValue); Serial.print(F(", volume: ")); Serial.println(soundVolume); }
  lastSensorValue = sensorValue;
  return (soundVolume);
}

// included in while loop during playback to check for volume changes
void plrAdjustVolume() {
  // volume control functions
  // read the input on analog pin 0 and check if we have a change in volume.
  sensorValue = analogRead(volumePotPin);
  if (lastSensorValue > sensorValue) {
    compareValue = lastSensorValue - sensorValue;
  } else {
    compareValue = sensorValue - lastSensorValue;
  }
  
  // If we have a high enough difference in the sensor reading, calculate it so we may set it on the player
  if (compareValue > sensorDrift) {
    // if (DEBUG) { Serial.print(F("changing volume: ")); }
    soundVolume = getVolume();
    musicPlayer.setVolume(soundVolume, soundVolume);
  } // end of change sound volume
}

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
void plrStop(void) {
  if (DEBUG) { Serial.println(F("Stopping playback")); }
  musicPlayer.stopPlaying();
}

// toggle pause
void plrTogglePause(void) {
  if (!musicPlayer.paused()) {
    if (DEBUG) { Serial.println(F("Pausing playback")); }
    musicPlayer.pausePlaying(true);
  } else {
    if (DEBUG) { Serial.println(F("Resuming playback")); }
    musicPlayer.pausePlaying(false);
  }
}

char playTrack(byte trackNo) {
  if (!musicPlayer.startPlayingFile(filename)) {
    issueWarning(8, "playback failed", false);
    return (-1);
  }

  unsigned long checkTime = millis();
  //
  //    LETS PLAY THE TRACK
  //
  while (musicPlayer.playingMusic || musicPlayer.paused()) {
    // file is now playing in the 'background' so now's a good time
    // to do something else like handling LEDs or buttons :)

    // check if we shall still fade the info light - depends on max light time and light startup time and also on the light button state
    if (((millis()-lightStartUpTime) > maxLightTime) && lightOn) { 
      if (DEBUG) Serial.println(F("Max Light Time reached, turn light off")); 
      switchLightState(); 
    }
  
    // fade the light
    if (lightOn) analogWrite(ledPin, 128 + 127 * cos(2 * PI / 20000 * millis()));
    
    // every ten seconds we do some checks
    if ((millis()-checkTime) > checkInterval) {
      if (DEBUG) Serial.print(checkTime);Serial.println(F("ms played - check LIGHT, NFC and BAT"));
      
      // check if we shall still fade the info light - depends on max light time and light startup time and also on the light button state
      if (((millis()-lightStartUpTime) > maxLightTime) && lightOn) { 
      if (DEBUG) Serial.println(F("Max Light Time reached, turn light off")); 
        switchLightState(); 
      }
      
      // TODO: check if the battery is still good
      //checkBattery();
      
      // TODO: check if we can read the tag and if not, stop/pause the playback
      //checkTagPresence();
      
      checkTime = millis(); // reset checktime so we can wait another 10 seconds aka 10000 ms
    }
    
    // check for changes to volume and adjust accordingly
    plrAdjustVolume();
    
    // check for button presses to pause, play next or previous track
    /*
    btnVal = analogRead(btnLinePin);
    if (btnVal > (btnLight - btnValDrift) && btnVal < (btnLight + btnValDrift)) { switchLightState(); if (!lightOn) { digitalWrite(ledPin, LOW); } }
    if (btnVal > (btnPause - btnValDrift) && btnVal < (btnPause + btnValDrift)) { plrTogglePause(); if (lightOn)  { digitalWrite(ledPin, LOW); } }
    if (btnVal > (btnNext - btnValDrift) && btnVal < (btnNext + btnValDrift))   { trackNo = trackNo + 1; return(trackNo); }
    if (btnVal > (btnPrev - btnValDrift) && btnVal < (btnPrev + btnValDrift))   { trackNo = trackNo - 1; return(trackNo); }
    */
    // check if the player is still playing our sounds and is NOT paused - otherwise we return a 0 to indicate successfull end of playback
    if (!musicPlayer.playingMusic && !musicPlayer.paused()) return (0);
  } // end of while playing music

  return (trackNo);
}

//
//      TTTTTTTTTT  RRRRRR       AA       CCCCC  KK   KK  DDDDDD    BBBBBB
//          TT      RR   RR     AAAA     CC      KK KK    DD    DD  BB    BB
//          TT      RRRRRR     AA  AA    CC      KKKK     DD    DD  BBBBBB
//          TT      RR   RR   AAAAAAAA   CC      KK KK    DD    DD  BB    BB
//          TT      RR   RR  AA      AA   CCCCC  KK   KK  DDDDDD    BBBBBB
//
// sets the directpry to play (plrCurrentFolder) and the track to start playback with (firstTrackToPlay)
boolean getDirAndTrackToPlay() {
  boolean plrStartPlaying = false;
  NfcTag tag = nfc.read();
  if (DEBUG) { Serial.print(F("Tag Type: ")); Serial.println(tag.getTagType()); Serial.print(F("UID: ")); Serial.println(tag.getUidString()); }

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
    return (plrStartPlaying);
  }
  return (plrStartPlaying);
}

/*
// write the tag data OBSOLETE
boolean writeNfcCardData(void) {
  char tDir[10] = " ";                            // a new char array to initially hold a space. next we concatenate plrCurrentFolder
  strcat(tDir, plrCurrentFolder);                 // the final tDir contains a space followed by the plrCurrentFolder
  char tTrack[5] = " ";                           // a new char array to initially hold a space and later add the firstTrackToPlay var
  char cstr[4];                                   // a new char array that will hold firstTrackToPlay as a char array
  itoa(firstTrackToPlay, cstr, 10);               // converting firstTrackToPlay to char and place it in cstr
  strcat(tTrack, cstr);                           // and finally concatenate cstr to tTrack so we can write tracks prependet by a space
  
  NdefMessage message = NdefMessage();
  message.addTextRecord(tDir);                    // In which directory are the files
  message.addTextRecord(tTrack);                  // Which Track did we play last

  //if (DEBUG){ Serial.print(F("about to write directory :"));Serial.print(tDir);Serial.print(F("! and track number :"));Serial.print(tTrack); }
  return(nfc.write(message));
}
*/

// write the created trackDbEntry into the Track DB on SD
boolean writeTrackDbEntry() {
  boolean success = false;
  byte bytesWritten;
  
  if (DEBUG) Serial.print(F("storing nfc <-> album connection: "));Serial.println(trackDbEntry);
  /*
  // FIRST write the trackDbFile --> ALBUMNFC.TXT
  File file = SD.open(trackDbFile, FILE_WRITE);
  bytesWritten = file.write(trackDbEntry, sizeof(trackDbEntry));
  file.close();                                   // and make sure everything is clean and save
  if (bytesWritten == sizeof(trackDbEntry)) {
    if (DEBUG) Serial.print(F(" ok. wrote "));Serial.print(bytesWritten);Serial.print(F(" byte(s) to "));Serial.println(trackDbFile);
    success = true; 
  } else {
    Serial.print(F("  error writing "));Serial.println(trackDbFile);
  }
  */
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
    if (DEBUG) Serial.print(F(" ok. wrote "));Serial.print(bytesWritten);Serial.print(F(" byte(s) to "));Serial.println(tDirFile);
  } else {
    Serial.print(F("  error writing "));Serial.println(tDirFile);
    success = false;
  }
  
  return (success);
}


// 
//      HH    HH  EEEEEE  LL      PPPPPP    EEEEEE  RRRRRR
//      HH    HH  EE      LL      PP    PP  EE      RR   RR
//      HHHHHHHH  EEEE    LL      PPPPPPP   EEEE    RRRRR
//      HH    HH  EE      LL      PP        EE      RR   RR
//      HH    HH  EEEEEE  LLLLLL  PP        EEEEEE  RR   RR
//
// stores the file to play in the global var filename - it is created from the gloal vars plrCurrentFolder and plrCurrentFile
boolean setFileNameToPlay(byte trackNo) {
  // convert the trackNo to a char array - we need it next to create the global var plrCurrentFile
  char curTrackCharNumber[4];
  sprintf(curTrackCharNumber, "%03d", trackNo);
  
  // create the name of the track to play from the curTrack
  strcpy(plrCurrentFile, "");
  strcat(plrCurrentFile, "track");
  strcat(plrCurrentFile, curTrackCharNumber);
  strcat(plrCurrentFile, ".mp3");

  // create the filename of the track to play, including path, so we can feed it to the music player
  strcpy(filename, "");
  strcat(filename, "/");
  strcat(filename, plrCurrentFolder);
  strcat(filename, "/");
  strcat(filename, plrCurrentFile);

  // return true or false for the filename created - this is checked
  return (SD.exists(filename));
}


// store uid, plrCurrentFolder and firstTrackToPlay in the char trackDbEntry
// so we may write it to the track Db file
void setTrackDbEntry() {
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
byte countFiles(File dir) {
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


// File listing helper
/*
void printDirectory(File dir, byte numTabs) {
  while (true) {
    File entry =  dir.openNextFile();
    // no more files
    if (! entry) {
      break;
    }

    for (byte i = 0; i < numTabs; i++) {
      Serial.print('\t');
    }

    Serial.print(entry.name());
    if (entry.isDirectory()) {
      Serial.println(F("/"));
      printDirectory(entry, numTabs + 1);
    } else {
      // files have sizes, directories do not
      Serial.print("\t\t");
      Serial.println(entry.size(), DEC);
    }
    entry.close();
  } // end while
}*/


//
//        WW            WW    AA      RRRRRR    NNNN    NN
//         WW    WW    WW    AAAA     RR   RR   NN NN   NN
//          WW  WWWW  WW    AA  AA    RR    RR  NN  NN  NN
//           WWWW  WWWW    AAAAAAAA   RRRRRRR   NN   NN NN
//            WW    WW    AA      AA  RR    RR  NN    NNNN
//
void issueWarning(byte errorcode, const char msg[20], boolean voiceOutput) {
  Serial.println(msg);
  if (voiceOutput) {
    strcpy(plrCurrentFolder, "system00");         // make sure we have the no album found track set in case we don't get information on the album to play
    firstTrackToPlay = errorcode;                 // that means track 2 in the system folder
    if (setFileNameToPlay(errorcode)) {        // and finally create the filenam that playTrack() ought to play
      playTrack(firstTrackToPlay);
    }
  }
  warnLed();
}


//
//  LL      EEEEEE  DDDDDD
//  LL      EE      DD   DD
//  LL      EEEE    DD   DD
//  LL      EE      DD   DD
//  LLLLLL  EEEEEE  DDDDDD
//
void dimLight(void) {
  digitalWrite(ledPin, LOW); 
  digitalWrite(warnPin, LOW); 
  digitalWrite(errorPin, LOW);
}

// switches the value of lightOn between true and false
void switchLightState(void) {
  if (!lightOn) {
    if (DEBUG) Serial.println(F("Switching light off -> ON"));
    lightOn = true;
    lightStartUpTime = millis(); // also sets the lightStartUpTime
  } else {
    if (DEBUG) Serial.println(F("Switching light on -> OFF"));
    lightOn = false;
    digitalWrite(ledPin, LOW);   // also turns off the info led
  }
}
//void infoLed(void) {
//  if (lightOn) analogWrite(ledPin, 128 + 127 * cos(2 * PI / 20000 * millis()));
//}
void errorLed(void) {
  digitalWrite(errorPin, HIGH);
}
void warnLed(void) {
  digitalWrite(warnPin, HIGH);
}
