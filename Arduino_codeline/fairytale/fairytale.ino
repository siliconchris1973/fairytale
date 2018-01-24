// BOF preprocessor bug prevent - insert me on top of your arduino-code
#if 1
__asm volatile ("nop");
#endif
/*
   Fairytale Main program

   This programm will read an nfc tag. It will check for a directory name and optional a track number
   and start playing all files in the directory (beginning with the track provided as last played track) 
   in numerical order from the directory.
   
   While the album (or file) is played an operations light is fading up and down in intensity. 
   On warnings and errors a warning or error light is dimmed up and down or flashed respectively.
   
   Errors shown via the error light (also cause the system to halt and the arduino must be turned off):
    - Music Maker Shield not found
    - Music Maker shield not on an interrupt enabled pin
    - SD card not found

   Warnings shown via a light (Arduino can stay turned on):
    - no directory entry on the nfc tag
    - no directory on SD card that matches the tag entry
    - no files in the provided directory
    - a missing file in a consecutive list of ordered files in the directory
      this may happen in case the files are not numerically ordered without a gap: 
      track001.mp3 exist, track002.mp3 is missing but track003.mp3 exists again

   Additionally to the warning or error lights certain messages are spoken through the music maker shield. 
   Voiced errors and warnings are:
    - no directory entry on the nfc tag
    - no directory found on the SD card that match the record on the nfc tag
    - no file(s) in the directory on the SD card
    - a missing file in a consecutive list of ordered files in the directory
   
   4 buttons are included:
    - pause / unpause     - pauses the playback or unpauses a paused playback
    - next                - play the next track in a consecurtive list of ordered files
    - previous            - play the previous track in a consecurtive list of ordered files
    - light on / off      - turn the operations light fader on or off

   Restrictions:
   1. All filenames must be in the format  trackXXX.mp3  - where XXX is a numbering from 001 to 127
   2. You can have a maximum of 127 files per directory - as I use a char to count the files to preserve memory
   3. All directory names must be exactly 8 chars long - use any combination of a-z and 0-9 chars for the name
   4. if a file is missing in a consecutive order, you may get a glitch in the sound while a warning light is lit up and down


   Used Pins:
    - CLK           13  SPI Clock shared with VS1053, SD card and NFC breakout board 
    - MISO          12  Input data from VS1053, SD card and NFC breakout board 
    - MOSI          11  Output data to VS1053, SD card and NFC breakout board 
    
    - SHIELD_CS      7  VS1053 chip select pin (output)
    - SHIELD_DCS     6  VS1053 Data/command select pin (output)
    - DREQ           3  VS1053 Data request, ideally an Interrupt pin
    
    - CARDCS         4  SD Card chip select pin
    
    - PN532_SS      10  NFC breakout board chip select pin

    - ledPin         5  the pin to which the operation led is connected to
    - warnPin        8  the pin to which the warning led is connected to
    - errorPin       9  the pin to which the error led is connected to
    - batLowInputPin 1  the pin to which the powerboost 1000c indicates a low baterry (ouput via errorPin)

    - volumePotPin  A0  the analog input pin that we use for the potentiometer
    - btnLinePin    A1  pin on which the button line (4 buttons) is connected
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
#define CLK           13    // SPI Clock, shared with VS1053, SD and PN532 card
#define MISO          12    // Input data, from VS1053, SD and PN532 card
#define MOSI          11    // Output data, to VS1053, SD and PN532 card

//
// SETUP MP3
// 
#include <Adafruit_VS1053.h>

// These are the pins used for the music maker shield
#define SHIELD_RESET  -1    // VS1053 reset pin (unused!)
#define SHIELD_CS      7    // VS1053 chip select pin (output)
#define SHIELD_DCS     6    // VS1053 Data/command select pin (output)

// These are common pins between breakout and shield
#define CARDCS         4    // Card chip select pin
// DREQ should be an Int pin, see http://arduino.cc/en/Reference/attachInterrupt
#define DREQ           3    // VS1053 Data request, ideally an Interrupt pin
// Create shield object
Adafruit_VS1053_FilePlayer musicPlayer = Adafruit_VS1053_FilePlayer(SHIELD_RESET, SHIELD_CS, SHIELD_DCS, DREQ, CARDCS);


//
// setup NFC Adapter
//
// Seedmaster Library with SPI
#include <PN532_SPI.h>
#include <PN532.h>
#include <NfcAdapter.h>
#define PN532_SCK     13    // changed from pin 2  to  13
#define PN532_MISO    12    // changed from pin 5  to  12
#define PN532_MOSI    11    // changed from pin 3  to  11
#define PN532_SS      10    // changed from pin 4  to  10
PN532_SPI pn532spi(SPI, PN532_SS);
NfcAdapter nfc = NfcAdapter(pn532spi);


//       VV       VV   Y       RRRRR
//        VV     VV   AAA     RR   RR
//         VV   VV   AA AA    RRRRRR
//          VV VV   AAAAAAA   RR   RR
//            V    AA     AA  RR   RR
//
// LIGHT EFFECTS
const byte ledPin               = 5;      // the pin to which the operation led is connected to
const byte warnPin              = 8;      // the pin to which the warning led is connected to
const byte errorPin             = 9;      // the pin to which the error led is connected to
const byte batLowInputPin       = 1;      // the pin to which the powerboost 1000c indicates a low baterry (ouput via errorPin)
boolean lightOn                 = true;   // if true, the operations light fader is active. is set to false via a button, or after a maxLightTime (see below) is reached

// uptime counters
unsigned long startUpTime       = 0;
const unsigned long maxUpTime   = 1800000L;  // how long will the system stay on while nothing is playing - default 1800000 = 30 Minutes
unsigned long lightStartUpTime  = 0;
const word maxLightTime         = 60000;     // how long shall the light stay on while nothing is playing?


// booleans to chose whether or not to show continuing warning messages in the loop
boolean loopWarningMessageNoFilesInDir = true;// make sure   no files in directory found   warning message is shown at least once
boolean loopWarningMessageFileNotFound = true;// make sure   file not found   warning message is shown at least once
boolean loopWarningMessageNoAlbumInfos = true;// make sure   no album info on nfc tag   warning message is shown at least once


// mp3 player variables
char plrCurrentFile[13]     = "track001.mp3";           // which track is the player playing?
char plrCurrentFolder[9]    = "system00";               // from which directory is the player playing?
char filename[23]           = "/system00/track001.mp3"; // path and filename of the track to play
byte firstTrackToPlay       = 1;                        // the track number as received from the tag


// NFC Tag data
byte uid[] = { 0, 0, 0, 0, 0, 0, 0 };    // Buffer to store the returned UID
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
const byte btnLinePin   = A1;      // pin on which the button line (4 buttons) is connected
const byte btnValDrift  = 20;      // maximum allowed difference + and - the predefined value for each button we allow
byte btnVal;                       // stores the value we receive on the btnLinePin for comparance with the predefined analog reads for the 4 buttons
const word btnLight     = 33;      // The value we receive from analog input if the Light On/Off Button is pressed
const word btnPause     = 66;      // The value we receive from analog input if the Pause Button is pressed
const word btnNext      = 128;     // The value we receive from analog input if the Next (aka Fast Forward) Button is pressed
const word btnPrev      = 230;     // The value we receive from analog input if the Previos (aka Prev or Rewind) Button is pressed


//
//        PPPPPP    RRRRR     OOOOOO   TTTTTTTT   OOOOOO   TTTTTTTT  YY    YY   PPPPPP    EEEEE   SSSSS
//       PP    PP  RR    RR  OO    OO     TT     OO    OO     TT      YY  YY   PP    PP  EE      SS
//       PPPPPPP   RRRRRRR  OO      OO    TT     OO    OO     TT       YYYY    PPPPPPP   EEEE     SSSSS
//       PP        RR    RR  OO    OO     TT     OO    OO     TT        YY     PP        EE          SS
//       PP        RR    RR   OOOOOO      TT      OOOOOO      TT        YY     PP        EEEEEE  SSSSS
//
// these are the prototypes for the nfc card reader
boolean getNfcCardData(void);                 // fill global vars with data from nfc tag and return true in case tag contains data or false if not
boolean writeNfcCardData(void);               // write the currently played track to the nfc tag, so we can start from there next time and return true for success and false in case of an error
boolean tagStillPresent(void);                // will return false in case the tag is no longer present


// these are the prototypes for the mp3 player controller
byte getVolume(void);                         // function that returns the volume setting based on the analog read
void plrAdjustVolume(void);                   // function to check for changes on the volume control and adjust volume accrodingly
void plrStop(void);                           // stops the player and return 0
void plrTogglePause(void);                    // pause and unpause the player and return 0
char playTrack(byte);                         // plays a track as defined by the global vars - and returns a -1 in case of an error, a 0 in case of success and a track number to play next in any other case

// prototype for warning
void issueWarning(byte, const char[], boolean); // show the message provided, activate warning light and voice warning (if boolean is true) 


// these are the prototypes to work on files and general helpers
//void printDirectory(File, byte);              // print out the content of specified directory on serial console
byte countFiles(File);                        // return the number of files in a directory passed as a File descriptor
boolean createFileNameToPlay(byte);           // creates the filename of the file to play from global vars plrCurrentFolder and plrCurrentFile and returns true if it exists


// these are the prototypes for the led info
void dimLight(void);                          // turn the operations light on on a very low level and the two other lights off
void turnLightOff(void);                      // turn the light's off
void turnLightOnOff(void);                    // switch the boolean var lightOn from true to false and vice versa - in case light is lightOn is set to true, lightStartUpTime is set to millis()
void infoLed(void);                           // smooth dimming based on millis() during playback
void errorLed(void);                          // rapid flashing of error led
void warnLed(void);                           // up and down dimming of the warning led


//
//       SSSSSS  EEEEEE  TTTTTTTT  UU   UU   PPPPP
//      SS       EE         TT     UU   UU  PP   PP
//       SSSSS   EEEE       TT     UU   UU  PPPPPP
//           SS  EE         TT     UU   UU  PP
//      SSSSSS   EEEEEE     TT      UUUUU   PP
//
void setup() {
  Serial.begin(38400);
  
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
  
  // set the buttons as input
  pinMode(volumePotPin, INPUT);
  pinMode(btnLinePin, INPUT);

  // and the leds as output
  pinMode(ledPin, OUTPUT);
  pinMode(warnPin, OUTPUT);
  pinMode(errorPin, OUTPUT);

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
  delay(500); // wait some time for everything to settle
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
  if (DEBUG) Serial.print(F("."));

  // if a tag is found, we continue
  weHaveATag = nfc.tagPresent(1000);
  if (weHaveATag) {                     
    if (DEBUG) Serial.println(F(" tag found!"));
    loopWarningMessageNoAlbumInfos = true;  // make sure we get the "no album info on tag" message at least once
    loopWarningMessageNoFilesInDir = true;  // make sure we get the "no files in dir" message at least once
    
    // read data from tag: directory, track number and playing order.
    if (!getNfcCardData()) {
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
          if (!createFileNameToPlay(curTrack)) {
            // created filename does not exit on SD card :-(
            if (loopWarningMessageFileNotFound) {
              loopWarningMessageFileNotFound = false; // set loop warning message so we don't show this warning in the next loop
              issueWarning(5, "file not found", false);
            }
            break;
          }
          if (DEBUG) { Serial.print(F("Track ")); Serial.print(curTrack); Serial.print(F("/")); Serial.print(numberOfFiles);Serial.print(F(": "));Serial.println(filename); }
          
          // make sure we remember the just started track to be the new track, in case player is stopped
          if (curTrack != firstTrackToPlay) {
            // in case we are on the last track, write the first track to the tag, so we start playback all from the beginning.
            if (curTrack == numberOfFiles) firstTrackToPlay = 1; else firstTrackToPlay = curTrack;
            
            //if (DEBUG) { Serial.print(F("Writing ")); Serial.print(firstTrackToPlay); Serial.println(F(" as first track to play on tag")); }
            if (!writeNfcCardData()) {
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
            // end of was playback successfull
            if (retVal == 0 && lightOn) {
              //if (DEBUG) { Serial.print(F("Done playing file ")); Serial.println(filename); }
              // dim the light
              dimLight();
            }
          }
          if (!musicPlayer.paused()) { turnLightOff(); }
        } // end of loop through files
      } // end of check if at least 1 file was found
      
      if (DEBUG) { Serial.println(F("end of playback")); }
    } // end of directory plus track retrieved from nfc tag
  } // end of tag is present
  
  weHaveATag = false;
  loopWarningMessageNoFilesInDir = true; // reset all loop warning messages so we can reuse it for the next album
  loopWarningMessageFileNotFound = true;
  loopWarningMessageNoAlbumInfos = true;
  
  turnLightOff(); 

  delay(1000); // throttle the loop for 1 second
} // end of loop


//
//        NN    NN  FFFFFF   CCCCCC
//        NNNN  NN  FF      CC
//        NN  N NN  FFFF    CC
//        NN  NNNN  FF      CC
//        NN    NN  FF       CCCCCC
//
//  BELOW THIS LINE THE NFC CONTROL IS DEFINED
//
boolean getNfcCardData() {
  boolean plrStartPlaying = false;
  NfcTag tag = nfc.read();
  if (DEBUG) { Serial.print(F("Tag Type: ")); Serial.println(tag.getTagType()); Serial.print(F("UID: ")); Serial.println(tag.getUidString()); }

  if (tag.hasNdefMessage()) {
    NdefMessage message = tag.getNdefMessage();

    // If you have more than 1 Message then it will cycle through them
    for (byte i = 0; i < message.getRecordCount(); i++) {
      NdefRecord record = message.getRecord(i);

      byte payloadLength = record.getPayloadLength();   // get length of record
      byte payload[payloadLength];                      // initialise payload variable to store content of record
      record.getPayload(payload);                       // extract the payload of this record
      char* p;                                          // this is where we store the result of strtok()
      
      p = strtok((char *)payload, " ");                 // separate payload on space-delimiter as it's form is like this:  en bluemc99   or equivalent
      p = strtok(NULL, " ");                            // we only need the second entry and strtok() expects NULL for string on subsequent calls
      switch (i) {
        case 0:
          plrStartPlaying = true;
          memset(plrCurrentFolder, 0, sizeof(plrCurrentFolder));
          memcpy(plrCurrentFolder, p, 8);               // copy directory from tag into global player var - so we know which dir to play files from
          break;
        case 1:
          byte i;
          i = atoi(p);
          firstTrackToPlay = i;                         // copy track number to firstTrackToPlay - so we know where to start the playback
          break;
        default:
          break;
      }
    }
    return (plrStartPlaying);
  }
  return (plrStartPlaying);
}

// write the tag data
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
  // if (DEBUG) { Serial.println(F("Stopping playback")); }
  musicPlayer.stopPlaying();
}

// toggle pause
void plrTogglePause(void) {
  if (!musicPlayer.paused()) {
    musicPlayer.pausePlaying(true);
  } else {
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

    // fade the light
    infoLed();

    // check for changes to volume and adjust accordingly
    plrAdjustVolume();

    // every ten seconds we check, if the tag is still there
    if ((millis()-checkTime) > 10000) {
      checkTime = millis();
      
      if (weHaveATag) {
        if (DEBUG) Serial.println(F("now checking tag"));
        //weHaveATag = nfc.tagPresent(1000);
        //Serial.print(F("tagPresent is "));Serial.println(nfc.tagPresent(1000));
      }
    }
    // check for button presses to pause, play next or previous track
    //btnVal = analogRead(btnLinePin);
    //if (btnVal > (btnLight - btnValDrift) && btnVal < (btnLight + btnValDrift)) turnLightOnOff());
    //if (btnVal > (btnPause - btnValDrift) && btnVal < (btnPause + btnValDrift)) plrTogglePause();
    //if (btnVal > (btnNext - btnValDrift) && btnVal < (btnNext + btnValDrift)) trackNo = trackNo + 1; return(trackNo);;
    //if (btnVal > (btnPrev - btnValDrift) && btnVal < (btnPrev + btnValDrift)) trackNo = trackNo - 1; return(trackNo);
    
    // turn off the operations light if nothing is playing and the system was on longer than a minute (or whatever is set in maxLightTime)
    if (((millis()-lightStartUpTime) > maxLightTime) && lightOn){
      turnLightOnOff();
    }
    
    // check if the player is still playing our sounds and is NOT paused - otherwise we return a 0 to indicate successfull end of playback
    if (!musicPlayer.playingMusic && !musicPlayer.paused()) return (0);
  } // end of while playing music

  return (trackNo);
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

// stores the file to play in the global var filename - it is created from the gloal vars plrCurrentFolder and plrCurrentFile
boolean createFileNameToPlay(byte trackNo) {
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
    if (createFileNameToPlay(errorcode)) {        // and finally create the filenam that playTrack() ought to play
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
  analogWrite(ledPin, 10); 
  digitalWrite(warnPin, LOW); 
  digitalWrite(errorPin, LOW);
}
void turnLightOnOff(void) {
  if (!lightOn) {
    lightOn = true;
    lightStartUpTime = millis();
  } else {
    lightOn = false;
    turnLightOff();
  }
}
void turnLightOff(void) {
  digitalWrite(ledPin, LOW); 
  digitalWrite(warnPin, LOW); 
  digitalWrite(errorPin, LOW); 
}
void infoLed(void) {
  if (lightOn) analogWrite(ledPin, 128 + 127 * cos(2 * PI / 20000 * millis()));
  //if (lightOn) analogWrite(warnPin, 128 + 127 * cos(2 * PI / 20000 * millis()));
}
void errorLed(void) {
  for (byte i = 0; i < 5; i++) {
    analogWrite(warnPin, 100); delay(100); digitalWrite(warnPin, LOW); delay(100);
    analogWrite(ledPin, 100); delay(100); digitalWrite(ledPin, LOW); delay(100);
  }
}
void warnLed(void) {
  for (byte i = 0; i <= 100; i++) { analogWrite(warnPin, i); analogWrite(ledPin, i); delay(50); }
  for (byte i = 100; i == 0; i--) { analogWrite(warnPin, i); analogWrite(ledPin, i); delay(50); }
  delay(500);
}
void blinkLeds() {
  //for (byte i = 0;i<3;i++) {
    digitalWrite(ledPin, HIGH);
    delay(250);
    digitalWrite(ledPin, LOW);
    delay(250);
    
    digitalWrite(warnPin, HIGH);
    delay(250);
    digitalWrite(warnPin, LOW);
    delay(250);
    
    digitalWrite(errorPin, HIGH);
    delay(250);
    digitalWrite(errorPin, LOW);
    delay(250);
  //}
}
