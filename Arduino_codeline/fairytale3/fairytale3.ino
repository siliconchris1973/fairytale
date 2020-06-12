#define VERSION 30

// BOF preprocessor bug prevent - insert me on top of your arduino-code
#if 1
__asm volatile ("nop");
#endif

// set according to the baudrate of your serial console. used for debugging output
#define BAUDRATE 115200

/*
   Fairytale Main program
   ---------------------------------------------------------------------------------------
   This programm will play albums (audiobooks or music) stored on the SD card inserted into
   the Adafruit Music Maker Shield. Selection of the album/audiobook to play is done by 
   placing corresponding NFC Tags on the NFC Reader.

   There are two pissibilities on how the connection between an NFC Tag and the corresponding 
   album on the SD card can be setup:
   1. An NDEF Message written to the tag in the form of:  en [directory name]
   2. Via the so called TrackDB - txt-files for each album in the directory trackdb0

   
   NDEF Implementation
   ---------------------------------------------------------------------------------------
   This implementation is based on the Speedmaster PN532 and Don's NDEF Library. Upon 
   detection of an NFC Tag placed on the reader it will check if there is at least one 
   NDEF Message written to the RFID tag. This message must be of the form 

      en [directory name]

   for example, the audiobook "Finding Nemo", stored in files in the directory
   
      /findnemo
      
   would have an NDEF message on the tag which reads as

      en findnemo
   
   There may also be a second NDEF message for the track to start playback with and this 
   would be in the form of

      en 1

   for the first track. To use this implementation you have to activate the configuration 
   option     NFCNDEF     below. For each album you have to write the NDEF Messages with the 
   directory name on the corrresponding tag. 
   This can be done with the program staticNFCWriter.ino from this repository.
   
   There is a downside to this implementation. It lacks a usable update of the track to 
   start playback with - I simply could not get it to work. Secondly the implementation
   lacks a reliable way of detecting the absence of a tag. Therefore the playback can only be 
   stopped by turning the box off. The third problem is with the used progmem. The two libraries 
   consume way too much progmem as opposed to the Adafruit PN532 library therefore I switched to:
   
   
   TrackDB-Implementation:
   ---------------------------------------------------------------------------------------
   Upon detection of an NFC Tag, the program will retrieve the tag's UID and use this to scan 
   what I call the TrackDB to find a matching directory to play.
   
   The TrackDB is a list of files in a special directory (TRACKDB0) on the SD card. The TrackDB
   files are named after the directory of the album and their respective content is of the form:
   
      taguid:directory:track
   
   For example, the audiobook "Finding Dorie" is stored in the directory    
   
      /findorie
      
   on the SD Card. The corresponding TrackDB file is stored at
      
      /trackdb0/findorie.txt

   It contains exactly one line:

      46722634231761290:findorie:1

   This line connects the Tag UID with the aformentioned directory plus the number of the track
   with which to start playback:
   
      46722634231761290   the UID of the NFC Tag
      findorie            the directory from which to play the files
      1                   the number of the track with which to start playback - here the 1st 

   To use this implementation you need to activate the configuration   NFCTRACKDB   
   You will also need to create the necessary TrackDb files. This can be done with the program
   createTrackDb.ino from this repository.
   
   
   Playback and controls
   ---------------------------------------------------------------------------------------
   Regardless of the way the program retrieved the information on which directory to play 
   (NDEF message or TrackDB), it will store this in the global var plrCurrentFolder and then 
   start a for-loop beginning with the provided first track until all consecutive numbered 
   tracks are played - for this it counts the number of files in the given dierctory. 
   
   While the album (or file) is played an operations light is fading up and down in intensity. 
   
   After playback of all files is finished, the program will resume it's main loop, delay 
   operation for roughly 15 seconds (to give the user the chance to remove the just used Tag 
   from the reader) and then wait until it detects the next tag.
   In case the figure is not removed from the reader, the album will be played again. To 
   prevent this from happening, there is a compile time switch below DISABLE_LOOPING. Enabling 
   this switch prevents the box from playing the same album again and again.
   
   While advancing through the files in the directory, the program will update the TrackDB-File 
   with  the number of the currently played track. Doing so allows for interrupted playbacks - 
   tag is removed and later put back on when the playback will start with the last track in 
   playback. <-- Attention this only works with the TrackDB and not with NDEF implementation.
   
   
   Restrictions
   ---------------------------------------------------------------------------------------
   For this to work, a couple of restrictions are in place:
   1. All filenames must be in the format  trackXXX.mp3, where XXX is a numbering from 001 to 127
   2. Follows from 1: You can have a maximum of 127 files per directory. I use a char to count the
      files in a directory to preserve memory and need the ability to return -1 in case of an error
   3. All directory names must be exactly 8 chars long. You may use any combination of a-z 
      and 0-9 chars for the directory name though
   4. if a file is missing in a consecutive order, you may get a glitch in the sound 
   5. As the Adafruit Music Maker Shield library does not support to jump to a specific 
      position within a file, the box can always only start from the beginning of a track.
   
   
   Warnings and errors
   ---------------------------------------------------------------------------------------
   On warnings or errors a warning or error light is lit up respectively. There are 3 
   different warning or error conditions:
   1) Missing information for playback warning
   2) Low Battery warning
   3) Missing hardware error
   
   Errors shown via the error light (also cause the system to halt):
   - Music Maker Shield not found
   - Music Maker shield not on an interrupt enabled pin
   - SD card not found
   - NFC Reader not found

   Warnings shown via a light (Arduino can stay turned on):
   - Low battery warning (surely the arduino will turn off but until then it will operate)
   - no directory found for the NFC Tag (aka TrackDB is missing an entry for the Tag)
   - no directory found on the SD card that match the NFC Tag TrackDB record
   - no files in the provided directory
   - a missing file in a consecutive list of ordered files in the directory
     this may happen in case the files are not numerically ordered without a gap: 
     track001.mp3 exist, track002.mp3 is missing but track003.mp3 exists again

   Additionally to the warning or error lights certain messages are spoken through the music . 
   maker shield. Voiced errors and warnings are:
   - Low Battery warning
   - no directory found for the NFC Tag (aka TrackDB is missing an entry for the Tag)
   - no directory found on the SD card that match the NFC Tag TrackDB record
   - no file(s) in the directory on the SD card


   Controls
   ---------------------------------------------------------------------------------------
   4 buttons are included:
   - Previous Track       - play the previous track in a consecurtive list of ordered files
   - Next Track           - play the next track in a consecurtive list of ordered files
   - Pause / Resume       - pauses the playback or unpauses a paused playback
   - Light on / off       - turn the operations light fader on or off

   
   The box is capable of being controlled by a remote control with the following functions
   - Volume Up            - increase volume by 5 per click
   - Volume Down          - decrease volume by 5 per click
   - Previous Track       - play the previous track in a consecurtive list of ordered files
   - Next Track           - play the next track in a consecurtive list of ordered files
   - Pause / Resume       - pauses the playback or unpauses a paused playback
   - Light on / off       - turn the operations light fader on or off
   
    
   Used Pins:
   ---------------------------------------------------------------------------------------
     NAME             PIN  USAGE
   - CLK / PN532_SCK   13  SPI Clock shared with VS1053, SD card and NFC breakout board 
   - MISO / PN532_MISO 12  Input data from VS1053, SD card and NFC breakout board 
   - MOSI / PN532_MOSI 11  Output data to VS1053, SD card and NFC breakout board 
   
   - SHIELD_CS          7  VS1053 chip select pin (output)
   - SHIELD_DCS         6  VS1053 Data/command select pin (output)
   - DREQ               3  VS1053 Data request, ideally an Interrupt pin
    
   - CARDCS             4  SD Card chip select pin
    
   - PN532_SS          10  NFC breakout board chip select pin

   YOU CAN EITHER CONNECT AND USE THE INFO AND WARNING LEDS OR THE 8x8 LED MATRIX
   - OPRLEDPIN          5  the pin to which the operation led is connected to
   - WRNLEDPIN          8  the pin to which the warning led is connected to
   - ERRLEDPIN          9  the pin to which the error led is connected to 
                            e.g. used for LBO of powerboost 1000c
    
   - MATRIX_DIN         9  the pin for the DATA IN port of the 8x8 led matrix 
   - MATRIX_CS          8  the pin for the Chip Select port of the 8x8 led matrix
   - MATRIX_CLK         5  the pin of the clock cycle port of the 8x8 led matrix
   
   - VOLPOTPIN         A0  the analog input pin that we use for the potentiometer
   - BTNLINPIN        A1  pin to which the button line (4 buttons) is connected to
   - LOWBATPIN         A2  the pin on which the powerboost 1000c indicates a low baterry - not functional
   - IRREMOTEPIN       A3  the pin on which the IR Remote Receiver is connected to
   - programming       A4  the pin the program button is connected to. The program 
                           button changes the functionality of the overall program in 
                           that (if pressed) the code will register a new tag for use with 
                           an album directory currently not connected to a tag 
                           Functionality yet to come!
   
   
   Configuration
   ---------------------------------------------------------------------------------------
   Some features (as e.g. Remote Control, Buttons or operation LED etc.) can be turned off 
   or on via #define switches in the code below.
   
      IRREMOTE          enables the IR Remote Control option
      
      BUTTONS           enables the 4 control buttons
      
      VOLUMEPOT         enables the volume potentiometer
      
      LOWBAT            enables the pin to read about low battery warnings from the adafruit powerboost 1000c

                        
                        YOU CAN ONLY EITHER ACTIVATE THE LEDs OR THE LEDMATRIX
                        
      OPRLIGHT          enables the operations light on the front of the box
      
      OPRLIGHTTIME      enables time based operations light - turns off the light after 30 Minutes

      INFOLED           enables a warning and an error led
      
      LEDMATRIX         enables the 8x8 LED Matrix to display working parameter

      
      SPEEDMASTER_PN532 enables the use of the Speedmaster library for the PN532 board
      
      ADAFRUIT_PN532    enables the use of the Adafruit library for the PN532 board
      
      NFCNDEF           enables the use of NDEF messages to get the directory for a tag
      
      NFCTRACKDB        enables the use of the TrackDB to get the directiry for a tag

      ALBUMNFC          enables a special file albumnfc.tdb in which all album <-> nfc
                        connections are stored - additional to the TrackDb files

      RESUMELAST        enables the option to resume last played album upon startup.
                        This is achieved via a file in the TrackDB and works without 
                        a tag but uses the pause/resume button instead 
      
      DISABLE_LOOPING   disables looping an album in case the figure is still on the 
                        reader when playback is finished
*/

//
//     CCCCC   OOOOOO   NN    NN  FFFFFF
//    CC      OO    OO  NNN   NN  FF
//    CC      OO    OO  NN NN NN  FFFF
//    CC      OO    OO  NN   NNN  FF
//     CCCCC   OOOOOO   NN    NN  FF
//
// make sure to comment this out before uploading in production as it turns on lots and lots of serial messages
// if it is not define, no Serial.print is possible, as also Serial.begin() is omitted
#define DEBUGOUT 1
// trace gives out even more info - does coszt quite some RAM so use with caution
//#define TRACEOUT 1
// to enable periodic output of free RAM during playBack, uncomment the following line.
//#define RAMCHECK 1


//
// turn ON / OFF certain hardware/software features
//
// if defined the box emits a sound whenever next / prev track or pause track is executed via buttons or ir remote
#define TONE_SIGNAL 1 

// to enable the IR Remote Control option uncomment the following line - does not work currently
//#define IRREMOTE 1

// to enable the control buttons uncomment the following and each corresponding line for the buttons
#define BUTTONS 1
#define VOLUP_BUTTON 1
#define VOLDOWN_BUTTON 1
#define NEXTTRACK_BUTTON 1
#define PREVTRACK_BUTTON 1
#define PAUSE_BUTTON 1
//#define LIGHT_BUTTON 1

// to enable the volume potentiometer uncomment the follwing line
//#define VOLUMEPOT 1

// to enable the low battery warning with light and voice uncomment the follwing line
//#define LOWBAT 1


//
// YOU CAN EITHER CONNECT AND USE THE INFO AND WARNING LEDS OR THE 8x8 LED MATRIX
//
// to enable the operations light on the front of the box, uncomment the following line
//#define OPRLIGHT 1
// to enable time based operations light - turns off the light after 30 Minutes - uncomment the following line
//#define OPRLIGHTTIME 1

// to enable the error and warning led, which is also used to indicate waiting for a tag, ucomment the next 
//#define INFOLED 1

// to enable the 8x8 LED Matrix uncomment the next
#define LEDMATRIX 1


// Define the PN532 implementation
// ONLY ONE of these two can be used and additionally the first one is obligatory in case 
// you want to use   NFCNDEF   for tag <--> album connection. If you opt for the TrackDB for this connection 
// (with option NFCTRACKDB below) you may also try the Adafruit library - it will additionally give you 
// track absence detection and has a smaller memory footprint. 
//#define SPEEDMASTER_PN532 1
#define ADAFRUIT_PN532 1

// Define the NFC <-> Album connection implementation
// ONLY ONE of the following two options for the NFC reading and album <-> tag connection can be chosen

// to use NDEF to get the album directory directly from the tag, uncomment the following line
// this implementation uses the Speedmaster Library and Don's NDEF library to read NFC Tags and
// get the album directory that is stored as an NDEF Message on the tag. That means, it does NOT
// use the decribed TrackDB. It is also much heavier (in Progmem size) than the Adafruit PN532
// implementation and does NOT support recognition of a removed tag. 
//#define NFCNDEF 1

// to use TrackDB to get the Tag UID and retrieve the directory from the trackDb, uncomment the following 
#define NFCTRACKDB 1

// uncomment to enable a special file albumnfc.tdb in which all album <-> nfc connections are stored 
// this is an additional storage to the individual TrackDb files and requires NFCTRACKDB 
//#define ALBUMNFC 1

// uncomment the next line to enable resuming the last played album on switch on
// this is achieved via a special file on the SD card and works without a tag but uses the pause/resume button instead
//#define RESUMELAST 1

// uncomment to disable looping an album in case the figure is still on the reader when playback is finished
#define DISABLE_LOOPING 1

// uncomment the next line to activate the VS1053 Component on the Music Maker Shield - aka the MP3 Player
#define VS1053 1

// uncomment the next line to activate the SD-CARD component on the Music Maker Shield
#define SDCARD 1


//
//    II  NN    NN   CCCCC  LL      UU    UU  DDDDDD    EEEEEE  SSSSSS
//    II  NNN   NN  CC      LL      UU    UU  DD    DD  EE      SS
//    II  NN NN NN  CC      LL      UU    UU  DD    DD  EEEE     SSSS
//    II  NN   NNN  CC      LL      UU    UU  DD    DD  EE          SS
//    II  NN    NN   CCCCC  LLLLLL   UUUUUU   DDDDDD    EEEEEE  SSSSSS
//
//    DDDDDD   EEEEEE  FFFFFF  II  NN    NN  EEEEEE  SSSSSS
//    DD   DD  EE      FF      II  NNN   NN  EE      SS
//    DD   DD  EEEE    FFFF    II  NN NN NN  EEEE     SSSS
//    DD   DD  EE      FF      II  NN   NNN  EE          SS
//    DDDDDD   EEEEEE  FF      II  NN    NN  EEEEEE  SSSSSS
//
// include SPI and SD libraries
//
#include <SPI.h>
#ifdef SDCARD
  #include <SD.h>  
#endif

// These are the SPI pins shared among all components
#define CLK             13    // SPI Clock shared with VS1053, SD card and NFC breakout board 
#define MISO            12    // Input data from VS1053, SD card and NFC breakout board 
#define MOSI            11    // Output data to VS1053, SD card and NFC breakout board 


//
// SETUP MUSIC MAKER SHIELD AND SD CARD READER
// 
#include <Adafruit_VS1053.h>
// These are the pins used for the music maker shield
#define SHIELD_RESET     -1    // VS1053 reset pin (unused!)
#define SHIELD_CS         7    // VS1053 chip select pin (output)
#define SHIELD_DCS        6    // VS1053 Data/command select pin (output)
// These are common pins between breakout and shield
#define CARDCS            4    // Card chip select pin
// DREQ should be an Int pin, see http://arduino.cc/en/Reference/attachInterrupt
#define DREQ              3    // VS1053 Data request, ideally an Interrupt pin

// Create shield object
Adafruit_VS1053_FilePlayer musicPlayer = 
  Adafruit_VS1053_FilePlayer(SHIELD_RESET, SHIELD_CS, SHIELD_DCS, DREQ, CARDCS);


//
// SETUP NFC ADAPTER
//
// this implementation uses the Speedmaster Library and Don's NDEF library to read NFC Tags and
// get the album directory that is stored as an NDEF Message on the tag. That means, it does NOT
// use the decribed TrackDB. It is also much heavier (in Progmem size than the Adafruit PN532
// implementation below and does NOT support recognition of a removed track. Furthermore the user
// has to turn off the box before she can listen to the next album :-(
#ifdef SPEEDMASTER_PN532
  // these includes are used for the NDEF implementation
  #include <PN532_SPI.h>
  #include <PN532.h>
  #include <NfcAdapter.h>
  
  #define PN532_SCK         13    // SPI Clock shared with VS1053, SD card and NFC breakout board 
  #define PN532_MISO        12    // Input data from VS1053, SD card and NFC breakout board 
  #define PN532_MOSI        11    // Output data to VS1053, SD card and NFC breakout board 
  #define PN532_SS          10    // NFC breakout board chip select pin
  PN532_SPI pn532spi(SPI, PN532_SS);
  NfcAdapter nfc = NfcAdapter(pn532spi);
#endif


// this implementation uses the Adafruit PN532 library alone - it is way smaller and preferrable
// as it allows for tag removal recognition and does not enforce the user to turn off the box
// after an album was played, as the above implementation does.
#ifdef ADAFRUIT_PN532
  // INCLUDE Adafruit NFC LIbrary here
  #include <Wire.h>
  #include <Adafruit_PN532.h>
  
  #define PN532_SCK         13    // SPI Clock shared with VS1053, SD card and NFC breakout board 
  #define PN532_MISO        12    // Input data from VS1053, SD card and NFC breakout board 
  #define PN532_MOSI        11    // Output data to VS1053, SD card and NFC breakout board 
  #define PN532_SS          10    // NFC breakout board chip select pin
  Adafruit_PN532 nfc(PN532_SCK, PN532_MISO, PN532_MOSI, PN532_SS);
#endif


//
// include IR Remote Control
//
#ifdef IRREMOTE
  #include <IRremote.h>

  #define IRREMOTEPIN A3  // the pin the IR remote control diode (receiver) is connected to
#endif


#ifdef BUTTONS
  #define BTNLINPIN   A1  // pin on which the button line (4 buttons) is connected
#endif

// volume control variables for the analog poti
#ifdef VOLUMEPOT
  #define VOLPOTPIN   A0  // the analog input pin that we use for the potentiometer
#endif

// battery control
#ifdef LOWBAT
  #define LOWBATPIN   A2  // pin on which the Adafruit PowerBoost will indicate a low battery
                          // this pin will usually be pulled high but when the charger detects 
                          // a low voltage (under 3.2V) the pin will drop down to 0V (LOW)
#endif



#ifdef OPRLIGHT
  #define OPRLEDPIN     5       // the pin to which the operation led is connected to
#endif

#ifdef INFOLED
  #define WRNLEDPIN       8       // the pin to which the warning led is connected to
  #define ERRLEDPIN      9       // the pin to which the error led is connected to
#endif


//
// include 8x8 LED MAtrix
//
#ifdef LEDMATRIX
  #include <LedControl.h>
  
  #define MATRIX_DIN 9              // DIN pin of MAX7219 module
  #define MATRIX_CLK 5              // CLK pin of MAX7219 module
  #define MATRIX_CS  8              // CS  pin of MAX7219 module
#endif


//       VV       VV   Y       RRRRR
//        VV     VV   AAA     RR   RR
//         VV   VV   AA AA    RRRRRR
//          VV VV   AAAAAAA   RR   RR
//            V    AA     AA  RR   RR
//
// mp3 player variables
char plrCurrentFolder[]     = "system00";                // directory containing the currently played tracks
char filename[]             = "/system00/track001.mp3";  // path and filename of the track to play
byte firstTrackToPlay       = 1;                         // the track number to play (used for the loop)
char nextTrackToPlay        = 1;                         // the track number to play next (or -1 in case of an error)

// in case looping of the last album is NOT wanted, we need a variable to store the 
// last payed album directory. With this var, we then will check if the album dir of 
// the tag equals the album of this variable and in case they do, we do not start 
// playback
#ifdef DISABLE_LOOPING 
  char plrLastFolder[]      = "NOFILES";
  boolean equal = true;
#endif

// file to hold the last played album (aka directory) name - from here we may retrieve other data from the trackDb 
#ifdef RESUMELAST
  const char resumeLastFile[] = "/trackdb0/LASTPLAY.TDB";
#endif


// trackDb on the SD card - this is where we store the NFC TAG <-> Directory connection and the track to start playback with
// and is the complementary implementation to the NDEF messages on the NFC Tag - see option NFCNDEF
#ifdef NFCTRACKDB
  const char trackDbDir[]   = "/trackdb0";  // where do we store the TrackDB files for each album 
  char trackDbFile[23];                     // path to the file with uid, directory and track
  char trackDbEntry[35];                    // will hold a nfc <-> album info connection 
                                            // in the form of [NFC Tag UID]:[album]:[Track] e.g.: 43322634231761291:larsrent:1

  #ifdef ALBUMNFC
    // a special file that additionally holds the connection between an NFC tag UID and the corresponding directory
    const char albumNfcFile[]  = "/trackdb0/NTRACKDB.TDB"; // formerly called albumnfc.tdb
  #endif
  
  // NFC Tag data
  byte uid[] = { 0, 0, 0, 0, 0, 0, 0 };     // Buffer to store the returned UID
  char charUid[22];                         // char representation of the UID
  byte uidLength;                           // Length of the UID (4 or 7 bytes depending on ISO14443A card type)
#endif 


// regardles wheter we use the poti, the button line or the ir remote, we always want to save the last sound volume
uint8_t lastSoundVolume = 40;         // from this value, which is the previous volume level

// volume control variables for the analog poti
#ifdef VOLUMEPOT
  word lastVolSensorValue                   = 0;    // keeps the last read sensor value
  const uint8_t minimumPotiValue            = 603;  // the minimum value the poti returns
  const uint16_t maximumPotiValue           = 1023; // the maximum value the poti returns
  const uint8_t minimumVolume               = 0;    // the minimum volume
  const uint8_t maximumVolume               = 100;  // the maximum volume
  
  const uint8_t valueDrift = 30;
#endif
  
// control buttons definition
#ifdef BUTTONS
  word btnVal;                        // stores the value we receive on the BTNLINPIN for comparance with the predefined analog reads for the 4 buttons
  const byte btnValDrift     = 5;     // maximum allowed difference + and - the predefined value for each button we allow
  const word btnPressDelay   = 500;   // delay in milliseconds to prevent double press detection
  unsigned long btnPressTime = 0;     // time in millis() when the button was pressed
  
  boolean buttonPressed = false;      // whenever a button on the button line or IR is pressed this var is set to true
  boolean volumeUp = true;            // if the volume down button is pressed, this is set to false otherwise its true 
                                      // the function plrAdjustVolume() reads this var in 
  const uint8_t volumeStepper = 5;    // and increases, decreases the volume by this factor
  
  #ifdef LIGHT_BUTTON
    const word btnLightValue   = 933;   // 33 Ohm  - The value we receive from analog input if the Light On/Off Button is pressed
  #endif
  #ifdef PAUSE_BUTTON
    const word btnPauseValue   = 1021;  // 1K Ohm  - The value we receive from analog input if the Pause Button is pressed
  #endif
  #ifdef NEXTTRACK_BUTTON
    const word btnNextValue    = 1002;  // 220 Ohm - The value we receive from analog input if the Next (aka Fast Forward) Button is pressed
  #endif
  #ifdef PREVTRACK_BUTTON
    const word btnPrevValue    = 991;   // 330 Ohm - The value we receive from analog input if the Previos (aka Prev or Rewind) Button is pressed
  #endif
  #ifdef VOLUP_BUTTON
    const word btnVolumeUpValue   = 456;
  #endif
  #ifdef VOLDOWN_BUTTON
    const word btnVolumeDownValue = 456;
  #endif
  
  const word minBtnValue     = 800;   // we use this value to determine, whether or not to check the buttons. Set to lower val than smallest of buttons
#endif


// IR remote control 
#ifdef IRREMOTE
  // IR Remote Control Layout               Codes from Silver Apple TV Remote Control
  //                +-------+
  //               |    UP   |                      53498
  //                +-------+
  //    +-------+   +-------+   +-------+
  //   |   LEFT  | |   HOME  | |  RIGHT  |  4346    47866   57594
  //    +-------+   +-------+   +-------+
  //                +-------+
  //               |   DOWN  |                      45306
  //                +-------+ 
  //       +-------+         +-------+  
  //      |  MENU  |         | PAUSE |      16634           31482
  //       +-------+         +-------+
  //
  // to reduce PROGMEM size I decided to not use the whole decimal value for each button on the remote control but instead do a calculation 
  // which reduces the needed size of the variable to hold the value but still creates different values for each button
  const uint16_t nextVal    = 57594;  // decoded value if button  NEXT  is pressed on remote
  const uint16_t prevVal    = 4346;   // decoded value if button  PREV  is pressed on remote
  const uint16_t volUpVal   = 53498;  // decoded value if button  UP    is pressed on remote
  const uint16_t volDwnVal  = 45306;  // decoded value if button  DOWN  is pressed on remote
  const uint16_t lightVal   = 47866;  // decoded value if button  HOME  is pressed on remote
  const uint16_t pauseVal   = 31482;  // decoded value if button  PAUSE is pressed on remote
  const uint16_t menuVal    = 16634;  // decoded value if button  MENU  is pressed on remote
  

  #ifndef BUTTONS
    boolean volumeUp = true;              // if the volume down button is pressed, this is set to false otherwise its true 
                                          // the function plrAdjustVolume() reads this var in 
    const uint8_t volumeStepper = 5;      // and increases, decreases the volume by this factor
  
    boolean buttonPressed = false;        // whenever a button on the IR is pressed this var is set to true to prevent double events
  #endif
                                          // after the corresponding function is executed, the var is set to false again
                                          // to prevent accidential repeated execution
  
  IRrecv irrecv(IRREMOTEPIN);             // define an object to read infrared sensor on pin A4
  decode_results results;                 // make sure decoded values from IR are stored 
#endif


// battery control
#ifdef LOWBAT
  unsigned long lowBatCheckTime = 0;   // used to throttle low battery messages to every 5 minutes
#endif


// LIGHT EFFECTS
#ifdef OPRLIGHT
  #ifdef OPRLIGHTTIME
    unsigned long lightStartUpTime = 0; // millis() the operations light started
  #endif
  
  boolean lightOn           = true;    // if true, the operations light fader is active. switched via a button, 
                                       // set to false after a maxLightTime (in case of OPRLIGHTTIME) is reached
#endif

#ifdef INFOLED
  boolean loopLightHigh       = false;   // we turn the warnLed on and off while waiting for the next tag
#endif

#ifdef LEDMATRIX
  const uint64_t IMAGES[] PROGMEM = {
                  //0x3c4299a581a5423c,   //  Happy Smiley
                  0x003e22222a2a1e00,   //  Error writing / reading to / from SD 
                  0x3c42a59981a5423c,   //  Sad Smiley
                  0xff0072856515e500,   //  NOVS1053 - VS1053 Not found
                  0xff0000555d5df500,   //  NOINT - No interrupt on DREQ pin
                  0x0036363636363600,   //  Pause
                  0x0000cc663366cc00,   //  Previous
                  0x00003366cc663300,   //  Next
                  0x000c1c3c7c3c1c0c,   //  Play
                  0x007e425a5a527600,   //  NOPN53 - Didn't find PN53x board
                  0x060e0c0808281800,   //  NOTE1
                  //0x066eecc88898f000,   //  NOTE2
                  //0x00082a1c771c2a08,   //  SONNE
                  //0x10387cfefeee4400,   //  HEART
                  //0x00496b5d5d6b4914,   //  Butterfly 1
                  //0x00082a3e3e2a0814,   //  Butterfly 2
                  0x1800183860663c00,   //  QUESTION
                  0x0088acafafac8800,   //  Volume UP
                  0x00088cafaf8c0800,   //  Volume DOWN
                  0xffffbb2f2a0a0808,   //  EQ1
                  0xffdffa5c5a480800,   //  EQ2
                  0xfffbf3b292900000,   //  EQ3
                  0xffeeeea6e2a20000,   //  EQ4
                  0xffefaf868a820000,   //  EQ5
                  0xffefee6a68602000,   //  EQ6
                  0xffefca4a08000000,   //  EQ7
                  0xffeec44000000000,   //  EQ8
                  0xffeeecc480808000,   //  EQ9
                  0x013e262a32324e80   //  NO SD CARD
                  //0x1818245a5a241800    //  Light
                  
                  
  };

  // for easiere selction of the images these constants can be used
  //#define HAPPY     0
  #define SADSD 0     // 1
  #define SAD 1       // 2
  #define NOVS1053 2  // 3
  #define NOINT 3     // 4
  #define PAUSE 4     // 5
  #define PREVIOUS 5  // 6
  #define NEXT 6      // 7
  #define PLAY 7      // 8
  #define NOPN53    8
  #define NOTE1 9     // 10
  //#define NOTE2     11
  //#define SONNE     12
  //#define HEART     13
  //#define BFLY1     14
  //#define BFLY2     15
  #define QUESTION 10  // 16
  #define VOLUMEUP 11  // 17
  #define VOLUMEDOWN 12 // 18
  #define EQ1 13      //  19
  #define EQ2 14      //  20
  #define EQ3 15      //  21
  #define EQ4 16      //  22
  #define EQ5 17      //  23
  #define EQ6 18      //  24
  #define EQ7 19      //  25
  #define EQ8 20      //  26
  #define EQ9 21      //  27
  #define NOSDCARD 22 //  28
  //#define LIGHT     29

  const byte PLR1STSEQ = EQ1; // cycle through equalizer while playing
  const byte PLRLSTSEQ = EQ9;
  
  byte MATRIX_INTENSITY  = 13;   // how bright from 0=off till 15=full
  uint64_t image;
  
  LedControl ledmatrix=LedControl(MATRIX_DIN, MATRIX_CLK, MATRIX_CS, 0);
#endif

//
//        PPPPPP    RRRRR     OOOOOO   TTTTTTTT   OOOOOO   TTTTTTTT  YY    YY   PPPPPP    EEEEE   SSSSS
//       PP    PP  RR    RR  OO    OO     TT     OO    OO     TT      YY  YY   PP    PP  EE      SS
//       PPPPPPP   RRRRRRR  OO      OO    TT     OO    OO     TT       YYYY    PPPPPPP   EEEE     SSSSS
//       PP        RR    RR  OO    OO     TT     OO    OO     TT        YY     PP        EE          SS
//       PP        RR    RR   OOOOOO      TT      OOOOOO      TT        YY     PP        EEEEEE  SSSSS
//
static boolean checkForTagPresence(void);       // checks if there is a tag on the reader, either Speedmaster or Adafruit style
static boolean checkForSameTag(void);           // checks if the same tag as the one for currently played album is still on the reader
                                                // this one can only be used with the Adafruit library and TrackDB implementation

static void plrAdjustVolume(void);              // function to check for changes on the volume control and adjust volume accrodingly

                                                // these are the prototypes for the mp3 player controller
static void plrStop(void);                      // stops the player
static void plrTogglePause(void);               // pause and unpause the player
static char playAlbum(uint8_t);                 // plays the album from plrCurrentFolder: returns -1 for error or a higher 
                                                // calls playTrack to actually play a track and check if that was successful and which 
                                                // track number to play next
static char playTrack(uint8_t);                 // plays a track as defined by the global var filename.
                                                // returns -1 for error, 0 for success and track number to play next
                                                // this can either be provided char+1 or char-1


                                                // these are the prototypes to work on files and general helpers
static uint8_t countFiles(File);                // return the number of files in a directory passed as a File descriptor
static boolean checkIfFileExists(void);         // returns true if the file from global vars plrCurrentFolder and plrCurrentFile exists on sd


                                                // helper functions to set global vars
static void setFileNameToPlay(byte);            // sets filename of the track to play from global vars plrCurrentFolder and plrCurrentFile


                                                // helper functions for the TrackDb 
                                                // these are the prototypes to retrieve and set directory and tracks to play
static boolean getDirAndTrackToPlay(boolean);   // retrieves the directory and track number 

static void checkAndSetCurTrack(byte, uint8_t); // function called from playAlbum for every file played. it checks if the current track is
                                                // the last in the album and if so sets firstTrackToPlay to 1. Otherwise firstTrackToPlay is set 
                                                // to curTrack and afterwards setTrackDbEntry is called to store the track
static void setTrackDbEntry(void);              // setTrackDbEntry stores the currently played file in the TrackDb plus (plus optionally the AlbumNFC 
                                                // file) to allow resuming a played album on the current track in case the box is turned off                                                
static boolean writeTrackDbEntry(void);         // store Tag UID, plrCurrentFolder and firstTrackToPlay in the trackDb (files on SD)

static boolean checkForResumeLast(void);        // allows to start the last played album without a tag being on the reader
                                                // for this to work it neads the TrackDb implementation and eitehr buttons or the remote control
                                                // if the box is started, not tag is on the reader and the pause/resume button is pressed, the last 
                                                // played album is continued

static void issueWarning(const char[], const char[], boolean); // the new warning method


                                                // these are the prototypes for the led
static void switchLightState(void);             // switch the boolean var lightOn from true to false and vice versa 
                                                // - in case light is lightOn is set to true, lightStartUpTime is set to millis()

static void displayStuff(int);                  // this is used to display smileys and the like on the 8x8 LED Matrix
void displayImage(uint64_t);

//
//       SSSSSS  EEEEEE  TTTTTTTT  UU   UU   PPPPP
//      SS       EE         TT     UU   UU  PP   PP
//       SSSSS   EEEE       TT     UU   UU  PPPPPP
//           SS  EE         TT     UU   UU  PP
//      SSSSSS   EEEEEE     TT      UUUUU   PP
//
void setup() {
  // SETUP SERIAL CONSOLE
  #ifdef DEBUGOUT
    // in case we want debug output
    Serial.begin(BAUDRATE);
    Serial.print(F("\nfairytale V"));Serial.println(VERSION);
  #endif
  #ifdef RAMCHECK
    // or at least print out available RAM
    Serial.begin(38400);
  #endif

  // DEFINE INPUT PINs
  #ifdef VOLUMEPOT
    pinMode(VOLPOTPIN, INPUT);       // connects to the potentiometer that shall control the volume
  #endif
  #ifdef BUTTONS
    pinMode(BTNLINPIN, INPUT);      // connects to the 4 buttons with different resistors (set the value down in function playTrack())
  #endif
  #ifdef LOWBAT
    pinMode(LOWBATPIN, INPUT);     // connects to the LBO pin of the Adafruit PowerBoost 1000c
  #endif
  #ifdef IRREMOTE
    pinMode(IRREMOTEPIN, INPUT);     // connects to the output port of the remote control (decoded values for each button in function playTrack())
  #endif

  // DEFINE OUPUT PINs
  #ifdef OPRLIGHT
    pinMode(OPRLEDPIN, OUTPUT);     // connect to blue LED
  #endif
  #ifdef INFOLED
    pinMode(WRNLEDPIN, OUTPUT);     // connect to orange LED
    pinMode(ERRLEDPIN, OUTPUT);    // connect to a red LED
  #endif

  #ifdef LEDMATRIX
    #ifdef TRACEOUT
      Serial.println(F("8x8 led matrix initialized"));
    #endif
    ledmatrix.shutdown(0, false);
    ledmatrix.setIntensity(0, MATRIX_INTENSITY);
    ledmatrix.clearDisplay(0);
  #endif
  
  // INITIALIZE THE MUSIC PLAYER
  if (!musicPlayer.begin()) {
    #ifdef DEBUGOUT
      Serial.println(F("VS1053 Not found"));
    #endif
    // flash the red light to indicate we have an error
    #ifdef INFOLED
      digitalWrite(ERRLEDPIN, HIGH);
    #endif
    #ifdef LEDMATRIX
      displayStuff(NOVS1053);
    #endif
    for (;;) { delay(1000); }
  } else {
    #ifdef TRACEOUT
      Serial.println(F("VS1053 music player setup"));
    #endif
  }
  
  // This option uses a pin interrupt. No timers required! But DREQ
  // must be on an interrupt pin. For Uno/Duemilanove/Diecimilla
  // that's Digital #2 or #3
  // See http://arduino.cc/en/Reference/attachInterrupt for other pins
  if (! musicPlayer.useInterrupt(VS1053_FILEPLAYER_PIN_INT)) {
    #ifdef DEBUGOUT
      Serial.println(F("DREQ without interrupt"));
    #endif
    #ifdef INFOLED
      digitalWrite(ERRLEDPIN, HIGH);
    #endif
    #ifdef LEDMATRIX
      displayStuff(NOINT);
    #endif
    for (;;) { delay(1000); }
  } else {
    #ifdef TRACEOUT
      Serial.println(F("Interrupt for VS1053 set"));
    #endif
  }
  
  // INITIALIZE THE SD CARD
  if (!SD.begin(CARDCS)) {
    #ifdef DEBUGOUT
      Serial.println(F("No SDCard found"));
    #endif
    // flash the red light to indicate we have an error
    #ifdef INFOLED
      digitalWrite(ERRLEDPIN, HIGH);
    #endif
    #ifdef LEDMATRIX
      displayStuff(NOSDCARD);
    #endif
    for (;;) { delay(1000); }
  } else {
    #ifdef TRACEOUT
      Serial.println(F("SD Card reader initialized"));
    #endif
  }

  // PLAY THE WELCOME SOUND
  musicPlayer.setVolume(lastSoundVolume, lastSoundVolume);
  if (playTrack(1) == -1) {       // play the welcome sound
    issueWarning("HELLO error", "", false);
  }
  
  // START THE NFC READER
  #ifdef SPEEDMASTER_PN532
    #ifdef TRACEOUT
      Serial.println(F("activating PN532 NFC reader"));
    #endif
    // either use the simple one with NDEF support to get the   tag <-> album directory  connection
    nfc.begin();
  #endif
  
  #ifdef ADAFRUIT_PN532
    #ifdef TRACEOUT
      Serial.println(F("activating PN532 NFC reader"));
    #endif
    // or use the Adafruit implementation, which allows for resume and rescan etc. 
    //   but needs the trackDB to get the album directory for a tag as no NDEF messages are supported
    nfc.begin();
    
    // make sure to comment this out after PN532 is working as it takes approx 290 bytes from progmem
    //*
    uint32_t versiondata = nfc.getFirmwareVersion();
    if (! versiondata) {
      #ifdef DEBUGOUT
        Serial.println(F("No PN53x board"));
      #endif
      #ifdef INFOLED
        digitalWrite(ERRLEDPIN, HIGH);
      #endif
      #ifdef LEDMATRIX
        displayStuff(NOPN53);
      #endif
      for (;;) { delay(1000); }
    }
    #ifdef TRACEOUT
      // Got ok data, print it out!
      Serial.print(F("Found chip PN5")); Serial.println((versiondata>>24) & 0xFF, HEX); 
      Serial.print(F("Firmware ver. ")); Serial.print((versiondata>>16) & 0xFF, DEC); 
      Serial.print('.'); Serial.println((versiondata>>8) & 0xFF, DEC);
    #endif
    //*/
    // configure board to read RFID tags
    nfc.setPassiveActivationRetries(0xFF);
    nfc.SAMConfig();
  #endif
  
  
  // ALL DONE
  delay(100); // wait some time for everything to settle
  
  // check our current time, so we know when to stop
  //startUpTime = millis();
  #ifdef DEBUGOUT
    Serial.print(F("\nwaiting "));
  #endif
  #ifdef LEDMATRIX
    displayStuff(NOTE1);
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
  boolean weHaveATag = false;                     // set true if a tag is present
  boolean resumeLast = false;                     // set true if the pause button (also on IR Remote) is pressed without a tag present
  boolean loopWarningMessageNoAlbumInfos = true;  // make sure we get the "no album info on tag" message at least once
  boolean loopWarningMessageNoFilesInDir = true;  // make sure we get the "no files in dir" message at least once
  
  #ifdef DEBUGOUT
    Serial.print(F("."));
    #ifdef INFOLED
      if (loopLightHigh) {
        digitalWrite(WRNLEDPIN, LOW);
        loopLightHigh = false;
      } else {
        digitalWrite(WRNLEDPIN, HIGH);
        loopLightHigh = true;
      }
    #endif
  #endif

  
  
  // check for tag presence or if the user wants to resume the last album
  weHaveATag = checkForTagPresence();
  resumeLast = checkForResumeLast();
  
  // if a tag is found or the pause button is pressed without a tag, we continue
  if (weHaveATag || resumeLast) {
    #ifdef INFOLED
      digitalWrite(WRNLEDPIN, LOW);
      loopLightHigh = false;
    #endif
    
    #ifdef DEBUGOUT
      if (weHaveATag) Serial.println(F(" tag found! ")); else Serial.println(F(" resume last "));
    #endif
    
    // read data from tag: directory, track number and playing order.
    // sets the directpry to play (plrCurrentFolder) and the track to start playback with (firstTrackToPlay)
    if (!getDirAndTrackToPlay(weHaveATag)) {      // if passed true, the function will try to get the information from a tag, 
                                                  // on false, it will try to read the last played album file - only with TrackDb option
      
      // if we don't get at least a directory we can't start playback and inform the user
      if (loopWarningMessageNoAlbumInfos) {
        loopWarningMessageNoAlbumInfos = false;
        issueWarning("no album info", "/system00/nodircar.mp3", true);
      }
    } else {  // we may start playing as it seems
      // check if the current directory is the same as the plrLastFolder
      // if it is and looping is disabled, then we won't restart playback
      #ifdef DISABLE_LOOPING
        equal = true;
        for (byte i=0; i<8; i++) {
          #ifdef TRACEOUT
            Serial.print(" last: ");
            Serial.print(plrLastFolder[i]); 
            Serial.print(" / current: ");
            Serial.print(plrCurrentFolder[i]);
          #endif
          if ( plrLastFolder[i] != plrCurrentFolder[i] ) {
            #ifdef TRACEOUT
              Serial.println(F(" is a new tag"));
            #endif
            equal = false;
            break;
          }
        }
        if (!equal) {
      #endif
          // now let's get the number of files in the album directory
          uint8_t numberOfFiles = countFiles(SD.open(plrCurrentFolder));
          
          // there is no file in the folder indicate this as a minor error
          if (numberOfFiles < 1) {
            if (loopWarningMessageNoFilesInDir) {
              loopWarningMessageNoFilesInDir  = false; // set loop warning message so we don't show this warning in the next loop
              issueWarning("no files found", "/system00/nodirtag.mp3", true);
              #ifdef LEDMATRIX
                displayStuff(SADSD);
              #endif
            }
          } else {
            // check if the current directory as read from the tag is the same as the plrLastFolder
            // if NOT, put the current directory in the last directory played var so we can dcide later whether 
            // or not we want to loop the current album - as instructed per compile time define
            #ifdef DISABLE_LOOPING
              // first we check whether or not the two variables are different 
              equal = true;
              for (byte i=0; i<8; i++) {
                if ( plrLastFolder[i] != plrCurrentFolder[i] ) equal = false;
              }
              // and only in this case we set plrLastFolder to the value of plrCurrentFolder
              if (!equal) {
                memset(plrLastFolder, 0, sizeof(plrLastFolder));       // make sure var to hold path is empty
                strcat(plrLastFolder, plrCurrentFolder);               // and add the Directory to it
              }
            #endif
            
            char retVal = playAlbum(numberOfFiles);
            retVal = nextTrackToPlay;
            if (retVal < 0) { 
              issueWarning("playback failed", "/system00/playfail.mp3", true);
            } else {  
              #ifdef TRACEOUT
                Serial.println(F("\nplayback end"));
              #endif
              #ifdef DEBUGOUT
                #ifndef TRACEOUT
                  Serial.println(F("\n"));
                #endif
              #endif
              #ifdef INFOLED
                digitalWrite(WRNLEDPIN, LOW);
              #endif
            }
          } // end of check if at least 1 file was found
          
      // DISABLE LOOPING
      #ifdef DISABLE_LOOPING
        } else {
          #ifdef TRACEOUT
            Serial.println(F("same tag detected"));
          #endif
        }
      #endif
    } // end of directory plus track retrieved from nfc tag
    
    // finally turn off the info led
    #ifdef OPRLIGHT
      if (lightOn) digitalWrite(OPRLEDPIN, LOW);
    #endif
    
    // RESET THE NFC READER
    #ifdef NFCNDEF
      // this now clears the NFC reader so it will recognize a new tag again
      nfc.begin();
    #endif
  } // end of tag is present
  
  delay(1000); // throttle the loop for 1 second
  
  // check if the battery is still good
  #ifdef LOWBAT
    if (digitalRead(LOWBATPIN == LOW)) {
      if ((millis()-lowBatCheckTime > 300000)) {
        digitalWrite(ERRLEDPIN, HIGH);
        issueWarning("BATTERY LOW", "/system00/lowbat01.mp3", true);
        lowBatCheckTime = millis();
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
//  BELOW THIS LINE THE MP3 PLAYER VOLUME CONTROL IS DEFINED
//
// included in while loop of playTrack() for checks for volume changes
static void plrAdjustVolume() {
  uint16_t soundVolume = lastSoundVolume;
  
  #ifdef VOLUMEPOT
    // this is the functionality, when we use the potentiometer to controle the volume
    // TODO: Make this work again
    // volume control functions

    // read the input on analog pin 0 and check if we have a change in volume.
    //const float soundVolume = constrain(analogRead(VOLPOTPIN) / 10, 0, 100) / 100.00;
    const uint16_t volSensorValue = analogRead(VOLPOTPIN);
    
    if ((volSensorValue < (lastVolSensorValue - valueDrift)) || (volSensorValue > (lastVolSensorValue + valueDrift))) {
      soundVolume = map(volSensorValue, minimumPotiValue, maximumPotiValue, minimumVolume, maximumVolume);
      
      #ifdef TRACEOUT
        Serial.print(F("VOL sensor value: "));Serial.print(volSensorValue);
        Serial.print(F(" / last sensor value: "));Serial.print(lastVolSensorValue);
        Serial.print(F(" / volume: "));Serial.print(soundVolume);
        Serial.print(F(" / last volume: "));Serial.println(lastSoundVolume);
      #endif
    }
    lastVolSensorValue = volSensorValue;
    lastSoundVolume = soundVolume;
  #endif
  
  #ifdef IRREMOTE
    // this is the functionality, when we use the infrared remote to control the volume
    // in case the variable volumeUp is set to true *volume Up Button pressed, we increase the volume
    if (buttonPressed) {
      if (volumeUp) {
        soundVolume += volumeStepper;
        lastSoundVolume = soundVolume;
        #ifdef LEDMATRIX
          displayStuff(VOLUMEUP);
        #endif
      } else {
        // otherwise we decrease the volume
        soundVolume -= volumeStepper;
        lastSoundVolume = soundVolume;
        #ifdef LEDMATRIX
          displayStuff(VOLUMEDOWN);
        #endif
      }
      // after everything is done make sure we don't execute this again accidentially
      buttonPressed = false;
    }
  #endif

  #ifdef BUTTONS
    #ifdef VOLUP_BUTTON
      #ifdef VOLDOWN_BUTTON
        if (buttonPressed) {
          if (volumeUp) {
            soundVolume += volumeStepper;
            lastSoundVolume = soundVolume;
            #ifdef LEDMATRIX
              displayStuff(VOLUMEUP);
            #endif
          } else {
            // otherwise we decrease the volume
            soundVolume -= volumeStepper;
            lastSoundVolume = soundVolume;
            #ifdef LEDMATRIX
              displayStuff(VOLUMEDOWN);
            #endif
          }
          // after everything is done make sure we don't execute this again accidentially
          buttonPressed = false;
        }
      #endif
    #endif
  #endif
  
  // finally call the player to adjust the volume
  musicPlayer.setVolume(soundVolume, soundVolume);
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
static void plrStop(void) {
  musicPlayer.stopPlaying();
  #ifdef LEDMATRIX
    displayStuff(NOTE1);
  #endif
}


// toggle pause
static void plrTogglePause(void) {
  if (!musicPlayer.paused()) {
    #ifdef DEBUGOUT
      Serial.println(F("Pause"));
    #endif
    musicPlayer.pausePlaying(true);
    #ifdef LEDMATRIX
      displayStuff(PAUSE);
    #endif
  } else {
    #ifdef DEBUGOUT
      Serial.println(F("Resume"));
    #endif
    musicPlayer.pausePlaying(false);
    #ifdef LEDMATRIX
      displayStuff(PLAY);
    #endif
  }
}


// iterates through al files in an album directory and calls playTrack for each track number iteratively
static char playAlbum(uint8_t numberOfFiles) {
  boolean loopWarningMessageFileNotFound = true;// make sure   file not found     warning message is shown at least once
  
  #ifdef DEBUGOUT
    Serial.print(F("Folder: ")); Serial.print(plrCurrentFolder);
  #endif
  #ifdef TRACEOUT
    Serial.print(F(" / Files: ")); Serial.print(numberOfFiles);
  #endif
  #ifdef DEBUGOUT
    Serial.print("\n");
  #endif
  #ifdef OPRLIGHTTIME
    lightStartUpTime = millis(); // store the time in millis when the  playback-for-loop started, so we can later check, 
                                 // whether or not the light shall continue to be on
  #endif
  for (byte curTrack = firstTrackToPlay; curTrack <= numberOfFiles; curTrack++) {
    #ifdef INFOLED
      digitalWrite(WRNLEDPIN, LOW); // in each for-loop, we make sure that the warning LED is NOT lit up
    #endif
    
    // set the filename we want to play in the global variable so the playTrack() function knows what to play
    setFileNameToPlay(curTrack);
    // and if it exists, lets play it
    if (!checkIfFileExists()) {
      // set filename does not exit on SD card :-(  issue a warning
      if (loopWarningMessageFileNotFound) {
        loopWarningMessageFileNotFound = false; // set loop warning message so we don't show this warning in the next loop
        issueWarning("file not found", "/system00/filnotfn.mp3", true);
      }
      break;  // try the filename - we break the for loop and skip to next number
    }
    #ifdef DEBUGOUT
      Serial.print(F("Track ")); Serial.print(curTrack); Serial.print(F("/"));Serial.print(numberOfFiles);
    #endif
    #ifdef TRACEOUT
      Serial.print(F(": "));Serial.print(filename);
    #endif
    #ifdef DEBUGOUT
      Serial.print("\n");
    #endif

    // make sure we remember the just started track to be the new track, in case player is stopped 
    // this works only with the NFC TrackDb and not with the NFC NDEF implementation
    checkAndSetCurTrack(curTrack, numberOfFiles);
    
    // play the track on the music maker shield and retrieve the nextTrackToPlay from global variable (it is set by playTrack())
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


// play a single track within an album - is called by playAlbum() or by issueWarning()
static char playTrack(uint8_t trackNo) {
  #ifdef OPRLIGHTTIME
    const unsigned long maxLightTime = 1800000L;// how long shall the light stay on while nothing is playing - 1800000L = 30 Minutes
  #endif
  const unsigned int checkInterval = 10000L;    // time in milliseconds between checks for battery status, tag presence and max light time

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
      if (lightOn && musicPlayer.paused()) analogWrite(OPRLEDPIN, 5);
      if (lightOn && !musicPlayer.paused()) analogWrite(OPRLEDPIN, 128 + 127 * cos(2 * PI / 20000 * millis()));
    #endif
    #ifdef LEDMATRIX
      // randomly cycle through the defined images from the sprite definition array
      displayStuff(random(PLR1STSEQ, PLRLSTSEQ));
    #endif
    
    // every ten seconds we do some checks
    if ((millis()-checkTime) > checkInterval) {
      #ifdef RAMCHECK
        Serial.print(F("free RAM: ")); Serial.println(freeRam());
      #endif
      
      // check if we shall still fade the info light - depends on max light time and light startup time and also on the light button state
      #ifdef OPRLIGHTTIME
        if (((millis()-lightStartUpTime) > maxLightTime) && lightOn) {
          #ifdef TRACEOUT
            Serial.println(F("Max Light Time reached, turn light off")); 
          #endif
          switchLightState(); 
        }
      #endif
      
      // check if the battery is still good
      #ifdef LOWBAT
        if (digitalRead(LOWBATPIN == LOW)) digitalWrite(ERRLEDPIN, HIGH);
      #endif
      
      // check if we can still read the tag and if not, stop/pause the playback
      #ifdef NFCTRACKDB
        if (!checkForSameTag()) plrTogglePause();
      #endif
      
      checkTime = millis(); // reset checktime so we can wait another 10 seconds aka 10000 ms
    }
    
    // check for changes to volume and adjust accordingly
    #ifdef VOLUMEPOT
      plrAdjustVolume();
    #endif
    
    // check for button presses to pause, play next or previous track or turn lights on/off
    #ifdef BUTTONS
      btnVal = analogRead(BTNLINPIN);
      if (btnVal > minBtnValue && (millis()-btnPressTime) > btnPressDelay) { 
        btnPressTime = millis(); 
        #ifdef TRACEOUT
          Serial.print(F("VALUE: "));Serial.print(btnVal - btnValDrift); 
          Serial.print(F(" < ")); Serial.print(btnVal); Serial.print(F(" < ")); Serial.print(btnVal + btnValDrift);
        #endif
        //
        //       Button Layout on the box:
        //
        //   +-------+  +-------+  +-------+  +-------+
        //   | LIGHT |  | <PREV |  | NEXT> |  | PAUSE |
        //   +-------+  +-------+  +-------+  +-------+
        //
        // PAUSE
        #ifdef PAUSE_BUTTON
          if ( ((btnVal - btnValDrift) < btnPauseValue) && ((btnVal + btnValDrift) > btnPauseValue) ) { 
            plrTogglePause();
            #ifdef TONE_SIGNAL
              musicPlayer.sineTest(0x42, 100);    // Make a tone to indicate button press
            #endif
          }
        #endif
        
        // PREV
        #ifdef PREVTRACK_BUTTON
          if ( ((btnVal - btnValDrift) < btnPrevValue)  && ((btnVal + btnValDrift) > btnPrevValue)  ) { 
            buttonPressed = true;
            #ifdef TRACEOUT
              Serial.print(F("Prev track "));Serial.print(nextTrackToPlay);Serial.println(F(" set"));
            #endif
            #ifdef LEDMATRIX
              displayStuff(PREVIOUS);
            #endif
            if (trackNo > 2) nextTrackToPlay = trackNo - 2;
            else nextTrackToPlay = 0;
            plrStop();
            #ifdef TONE_SIGNAL
              musicPlayer.sineTest(0x42, 100);    // Make a tone to indicate button press
            #endif
            buttonPressed = false;
            return(nextTrackToPlay); 
          }
        #endif

        // NEXT
        #ifdef NEXTTRACK_BUTTON
          if ( ((btnVal - btnValDrift) < btnNextValue)  && ((btnVal + btnValDrift) > btnNextValue)  ) { 
            buttonPressed = true;
            #ifdef TRACEOUT
              Serial.print(F("Next track "));Serial.print(nextTrackToPlay);Serial.println(F(" set"));
            #endif
            #ifdef LEDMATRIX
              displayStuff(NEXT);
            #endif
            plrStop();
            nextTrackToPlay = trackNo;
            #ifdef TONE_SIGNAL
              musicPlayer.sineTest(0x42, 100);    // Make a tone to indicate button press
            #endif
            buttonPressed = false;
            return(nextTrackToPlay);
          }
        #endif

        // VOLUME UP
        #ifdef VOLUP_BUTTON
          if ( ((btnVal - btnValDrift) < btnVolumeUpValue)  && ((btnVal + btnValDrift) > btnVolumeUpValue)  ) { 
            buttonPressed = true;
            #ifdef TRACEOUT
              Serial.print(F("volume up "));
            #endif
            #ifdef LEDMATRIX
              displayStuff(VOLUMEUP);
            #endif
            volumeUp = true;
            plrAdjustVolume();
            buttonPressed = false;
          }
        #endif

        // VOLUME DOWN
        #ifdef VOLDOWN_BUTTON
          if ( ((btnVal - btnValDrift) < btnVolumeDownValue)  && ((btnVal + btnValDrift) > btnVolumeDownValue)  ) { 
            buttonPressed = true;
            #ifdef TRACEOUT
              Serial.print(F("volume down "));
            #endif
            #ifdef LEDMATRIX
              displayStuff(VOLUMEDOWN);
            #endif
            volumeUp = false;
            plrAdjustVolume();
            buttonPressed = false;
          }
        #endif
        
        // LIGHT
        #ifdef LIGHT_BUTTON
          #ifdef OPRLIGHT
            if ( ((btnVal - btnValDrift) < btnLightValue) && ((btnVal + btnValDrift) > btnLightValue) ) { 
              switchLightState();
              #ifdef TONE_SIGNAL
                musicPlayer.sineTest(0x42, 100);    // Make a tone to indicate button press
              #endif
            }
          #endif
        #endif
      }
    #endif

    #ifdef IRREMOTE
      // IR Remote Control Layout                 Codes from the Apple TV Remote (Silver Model)
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
        switch (switchValue) {
          // PREV
          case prevVal:
            buttonPressed = true;
            #ifdef TRACEOUT
              Serial.print(F("Prev track "));Serial.print(nextTrackToPlay);Serial.println(F(" set"));
            #endif
            #ifdef LEDMATRIX
              displayStuff(PREVIOUS);
            #endif
            plrStop();
            #ifdef TONE_SIGNAL
              musicPlayer.sineTest(0x42, 100);    // Make a tone to indicate button press
            #endif
            if (trackNo > 2) nextTrackToPlay = trackNo - 2; else nextTrackToPlay = 0;
            buttonPressed = false;
            return(nextTrackToPlay); 
            break;
            
          // NEXT
          case nextVal:
            buttonPressed = true;
            #ifdef TRACEOUT
              Serial.print(F("Next track "));Serial.print(nextTrackToPlay);Serial.println(F(" set"));
            #endif
            #ifdef LEDMATRIX
              displayStuff(NEXT);
            #endif
            plrStop();
            #ifdef TONE_SIGNAL
              musicPlayer.sineTest(0x42, 100);    // Make a tone to indicate button press
            #endif
            nextTrackToPlay = trackNo;
            buttonPressed = false;
            return(nextTrackToPlay);
            break;
            
          // PAUSE
          case pauseVal:
            buttonPressed = true;
            #ifdef TONE_SIGNAL
              musicPlayer.sineTest(0x42, 100);    // Make a tone to indicate button press
            #endif
            plrTogglePause();
            buttonPressed = false;
            break;
            
          // LIGHT
          #ifdef OPRLIGHT
            case lightVal:
              buttonPressed = true;
              switchLightState();
              buttonPressed = false;
              break;
          #endif
          
          // VOL UP
          case volUpVal:
            buttonPressed = true;
            #ifdef TRACEOUT
              Serial.println(F("Volume Up"));
            #endif
            #ifdef LEDMATRIX
              displayStuff(VOLUMEUP);
            #endif
            volumeUp = true;
            plrAdjustVolume();
            buttonPressed = false;
            break;
            
          // VOL DOWN
          case volDwnVal:
            buttonPressed = true;
            #ifdef TRACEOUT
              Serial.println(F("Volume Down"));
            #endif
            #ifdef LEDMATRIX
              displayStuff(VOLUMEDOWN);
            #endif
            volumeUp = false;
            plrAdjustVolume();
            buttonPressed = false;
            break;
            
          // MENU
          // CURRENTLY NO FUNCTION FOR MENU
          //case menuVal:
          //  #ifdef TRACEOUT
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
  
  #ifdef IRREMOTE
    buttonPressed = false;
  #endif
  #ifdef BUTTON
    buttonPressed = false;
  #endif
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
// if passed true, the function will try to get the information from a tag, on false, it will try to read 
// the last played album file
static boolean getDirAndTrackToPlay(boolean readFromTag) {
  boolean plrStartPlaying = false;

  if (readFromTag) {
    #ifdef SPEEDMASTER_PN532
      // read the tag object with the Speedmaster PN532 library
      NfcTag tag = nfc.read();
      #ifdef TRACEOUT
        Serial.print(F("Tag Type: ")); Serial.println(tag.getTagType()); Serial.print(F("UID: ")); Serial.println(tag.getUidString());
      #endif
    #endif

    #ifdef ADAFRUIT_PN532
      // TODO: implement reading tag data with the Adafruit PN532 library
    #endif
    
    #if NFCNDEF
      // GET ALBUM DIRECTORY TO PLAY FROM TAG NDEF MESSAGES
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
        #ifdef TRACEOUT
          Serial.print(F("Folder from tag: "));Serial.println(plrCurrentFolder);
        #endif
        //return (plrStartPlaying);
      }
    #endif
    #ifdef NFCTRACKDB
      // GET ALBUM DIRECTORY TO PLAY FROM THE TRACKDB
    #endif
  } else {
    // GET THE ALBUM FROM LAST PLAYED SESSION FILE
  }
  return (plrStartPlaying);
}


// make sure we remember the just started track to be the new track, in case player is stopped 
static void checkAndSetCurTrack(byte curTrack, uint8_t numberOfFiles){
  #ifdef NFCTRACKDB
    if (curTrack != firstTrackToPlay) {
      // in case we are on the last track, choose the first track, so we start playback all from the beginning.
      if (curTrack == numberOfFiles) firstTrackToPlay = 1; else firstTrackToPlay = curTrack;
      
      // now store this new first track in the TrackDB
      // first create the new trackDb entry:
      setTrackDbEntry();
      // second store this entry in the TrackDb files, plus optional in the albumnfc.tdb file
      if (!writeTrackDbEntry()) {
        issueWarning("trackdb update error", "", false);
      }
      #ifdef LEDMATRIX
        displayStuff(SADSD):
      #endif
    }
  #endif
}


// write the created trackDbEntry into the Track DB on SD
static boolean writeTrackDbEntry() {
  boolean success = true;
  
  #ifdef NFCTRACKDB
    byte bytesWritten;
    
    #ifdef DEBUGOUT
      Serial.print(F("saving"));
    #endif
    #ifdef TRACE
      Serial.print(F(" nfc <-> album: "));Serial.print(trackDbEntry);
    #endif
    #ifdef DEBUGOUT
      Serial.print(F("\n"));
    #endif
    // FIRST (if set) write the AlbumNFC file  --> ALBUMNFC.TDB
    #ifdef ALBUMNFC
      File file = SD.open(albumNfcFile, FILE_WRITE);
      bytesWritten = file.write(trackDbEntry, sizeof(trackDbEntry));
      file.close();                                      // and make sure everything is clean and save
  
      // now check if the write was successful - means we wrote the number of bytes of the trackDb entry to the file
      if (bytesWritten == sizeof(albumNfcFile)) {
        #ifdef TRACEOUT
          Serial.print(F(" ok. "));Serial.print(bytesWritten);Serial.print(F(" byte(s) written to "));Serial.println(albumNfcFile);
        #endif
        success = true;
      } else {
        #ifdef DEBUGOUT
          Serial.print(F(" error writing "));Serial.println(albumNfcFile);
        #endif
        #ifdef LEDMATRIX
          displayStuff(SADSD);
        #endif
        #ifdef INFOLED
          digitalWrite(WRNLEDPIN, HIGH);
        #endif
        success = false;
      }
    #endif
    
    // SECOND write the TrackDb-File --> e.g. larsrent.txt
    memset(trackDbFile, 0, sizeof(trackDbFile));       // make sure var to hold path to track db file is empty
    strcat(trackDbFile, trackDbDir);                   // add the trackDb Directory to the 
    strcat(trackDbFile, "/");                          // a / 
    strcat(trackDbFile, plrCurrentFolder);             // and the filename
    strcat(trackDbFile, ".txt");                       // plus of course a txt extension
    SD.remove(trackDbFile);                            // we want the file to be empty prior writing directory and track to it, so we remove it
    
    // used in case the albumnfc.tdb file is written first - redeclare file var
    #ifdef ALBUMNFC
      file = SD.open(trackDbFile, FILE_WRITE);
    #endif
    // used in case we only write the TrackDB file - need to initially declare file var
    #ifndef ALBUMNFC
      File file = SD.open(trackDbFile, FILE_WRITE);
    #endif
    bytesWritten = file.write(trackDbEntry, sizeof(trackDbEntry));
    file.close();
  
    // now check if the write was successful - means we wrote the number of bytes of the trackDb entry to the file
    if (bytesWritten == sizeof(trackDbEntry)) {
      #ifdef TRACEOUT
        Serial.print(F(" ok. "));Serial.print(bytesWritten);Serial.print(F(" byte(s) written to "));Serial.println(trackDbFile);
      #endif
      success = true;
    } else {
      #ifdef DEBUGOUT
        Serial.print(F(" error writing "));Serial.println(trackDbFile);
      #endif
      #ifdef LEDMATRIX
        displayStuff(SADSD);
      #endif
      #ifdef INFOLED
        digitalWrite(WRNLEDPIN, HIGH);
      #endif
      success = false;
    }
  
    // THIRD (if set) write the plrCurrentFolder (aka the album directory) to the file /trackdb0/LASTPLAY.TDB
    #ifdef RESUMELAST
      file = SD.open(resumeLastFile, FILE_WRITE);
      bytesWritten = file.write(plrCurrentFolder, sizeof(plrCurrentFolder));
      file.close();
    #endif
  #endif
  
  return (success);
}


// 
//      NN    NN  FFFFFF  CCCCC
//      NNN   NN  FF     CC
//      NN NN NN  FFFF   CC
//      NN   NNN  FF     CC
//      NN    NN  FF      CCCCC
//
// check Tag presence is used in the loop() (to populate the char array with the uid of the tag) and in function playTrack() to see
// if the tag is still on the reader - this can only be used with the Adafruit NFC library
boolean checkForSameTag() {
  boolean sameTagPresent = true;

  return(sameTagPresent);
}

boolean checkForTagPresence(void) {
  boolean weHaveATag = false;
  #ifdef SPEEDMASTER_PN532
    // this implementation uses the Speedmaster Library and Don's NDEF lib
    weHaveATag = nfc.tagPresent(1000);
  #endif
  #ifdef ADAFRUIT_PN532
    // this implementation uses the Adafruit PN532 library alone
    weHaveATag = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);
  #endif
  
  return(weHaveATag);
}


// 
//      HH    HH  EEEEEE  LL      PPPPPP    EEEEEE  RRRRRR
//      HH    HH  EE      LL      PP    PP  EE      RR   RR
//      HHHHHHHH  EEEE    LL      PPPPPPP   EEEE    RRRRR
//      HH    HH  EE      LL      PP        EE      RR   RR
//      HH    HH  EEEEEE  LLLLLL  PP        EEEEEE  RR   RR
//

// this allows for the pause/resume button to be pressed without a tag being present
// in this case the last played album is resumed - given there was one. 
static boolean checkForResumeLast(){
  boolean resumeLast = false;
  #ifdef RESUMELAST
    // Of course works only when we have the Buttons 
    #ifdef BUTTONS
      btnVal = analogRead(BTNLINPIN);
      if (btnVal > minBtnValue && (millis()-btnPressTime) > btnPressDelay) 
        if ( ((btnVal - btnValDrift) < btnPauseValue) && ((btnVal + btnValDrift) > btnPauseValue) ) resumeLast = true;
    #endif
    // ... or the IR Remote Control implementation
    #ifdef IRREMOTE
      if (irrecv.decode(&results)) if ( results.value == pauseVal ) resumeLast = true;
    #endif
  #endif
  return (resumeLast);
}


// stores the file to play in the global var filename - it is created from the gloal vars plrCurrentFolder and current track
static void setFileNameToPlay(byte trackNo) {
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
}

// return true or false for the filename created - this is checked
static boolean checkIfFileExists(void){
  return (SD.exists(filename));
}

// store uid, plrCurrentFolder and firstTrackToPlay in the char array trackDbEntry[]
// so we may write it to the track Db file
static void setTrackDbEntry() {
  #ifdef NFCTRACKDB
    char tmpbuf[4];                                 // temp buffer for one number of the uid
      
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
  #endif
}


//
//  RRRRRR      AA      MMM  MMM
//  RR   RR    AAAA    MM  MM  MM
//  RRRRRR    AA  AA   MM  MM  MM
//  RR   RR  AAAAAAAA  MM      MM
//  RR   RR AA      AA MM      MM
//
#ifdef RAMCHECK
// return the free RAM - called periodically during playTrack()
int freeRam () {
  extern int __heap_start, *__brkval;
  int v;
  return (int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval);
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
static uint8_t countFiles(File dir) {
  uint8_t counter = 0;
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
  #ifdef DEBUGOUT
    Serial.println(msg);
  #endif
  if (voiceOutput && SD.exists(filename)) {
    musicPlayer.playFullFile(filename);
  } 
  #ifdef INFOLED
    digitalWrite(WRNLEDPIN, HIGH);
  #endif
  #ifdef LEDMATRIX
    displayStuff(SAD);
  #endif
}


//
//  LL      EEEEEE  DDDDDD
//  LL      EE      DD   DD
//  LL      EEEE    DD   DD
//  LL      EE      DD   DD
//  LLLLLL  EEEEEE  DDDDDD
//
// switches the value of lightOn between true and false - only needed in case there is a LED attached
static void switchLightState(void) {
  #ifdef OPRLIGHT
    #ifdef LEDMATRIX
      displayStuff(LIGHT):
    #endif
    if (!lightOn) {
      #ifdef TRACEOUT
        Serial.println(F("Switching light off -> ON"));
      #endif
      lightOn = true;
      #ifdef OPRLIGHTTIME
        lightStartUpTime = millis(); // also sets the lightStartUpTime
      #endif
    } else {
      #ifdef TRACEOUT
        Serial.println(F("Switching light on -> OFF"));
      #endif
      lightOn = false;
      digitalWrite(OPRLEDPIN, LOW);   // also turns off the info led
    }
  #endif
}

static void displayStuff(int i){
  #ifdef LEDMATRIX
    memcpy_P(&image, &IMAGES[i], 8);
    displayImage(image);
  #endif
}

void displayImage(uint64_t image) {
  #ifdef LEDMATRIX
    for (int i = 0; i < 8; i++) {
      byte row = (image >> i * 8) & 0xFF;
      for (int j = 0; j < 8; j++) {
        ledmatrix.setLed(0, i, j, bitRead(row, j));
      }
    }
  #endif
}
