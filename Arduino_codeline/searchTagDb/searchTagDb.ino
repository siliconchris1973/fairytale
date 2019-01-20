#define VERSION 2

//
//     CCCCC   OOOOOO   NN    NN  FFFFFF
//    CC      OO    OO  NNN   NN  FF
//    CC      OO    OO  NN NN NN  FFFF
//    CC      OO    OO  NN   NNN  FF
//     CCCCC   OOOOOO   NN    NN  FF
//
// make sure to comment this out before uploading in production as it turns on lots and lots of serial messages
// if it is not define, no Serial.print is possible, as also Serial.begin() is omitted
#define DEBUG 1
// to enable periodic output of free RAM during playBack, uncomment the following line.
//#define RAMCHECK 1


//
// turn ON / OFF certain hardware/software features
//
// to enable the IR Remote Control option uncomment the following line - does not work currently
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

// uncomment to enable a special file albumnfc.tdb in which all album <-> nfc connections are stored 
// this is an additional storage to the individual TrackDb files and requires NFCTRACKDB 
//#define ALBUMNFC 1

// uncomment the next line to enable resuming the last played album on switch on
// this is achieved via a special file on the SD card and works without a tag but uses the pause/resume button instead
//#define RESUMELAST 1



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
#include <SD.h>


// These are the SPI pins shared among all components
#define CLK             13    // SPI Clock shared with VS1053, SD card and NFC breakout board 
#define MISO            12    // Input data from VS1053, SD card and NFC breakout board 
#define MOSI            11    // Output data to VS1053, SD card and NFC breakout board 


//
// SETUP MUSIC MAKER SHIELD
// 
#include <Adafruit_VS1053.h>
// These are the pins used for the music maker shield
#define SHIELD_RESET     -1    // VS1053 reset pin (unused!)
#define SHIELD_CS         7    // VS1053 chip select pin (output)
#define SHIELD_DCS        6    // VS1053 Data/command select pin (output)


//
// SETUP SD CARD
//
// These are common pins between breakout and shield
#define CARDCS            4    // Card chip select pin
// DREQ should be an Int pin, see http://arduino.cc/en/Reference/attachInterrupt
#define DREQ              3    // VS1053 Data request, ideally an Interrupt pin
// Create shield object
Adafruit_VS1053_FilePlayer musicPlayer = Adafruit_VS1053_FilePlayer(SHIELD_RESET, SHIELD_CS, SHIELD_DCS, DREQ, CARDCS);


//
// SETUP NFC ADAPTER
//
// this implementation uses the Speedmaster Library and Don's NDEF library to read NFC Tags and
// get the album directory that is stored as an NDEF Message on the tag. That means, it does NOT
// use the decribed TrackDB. It is also much heavier (in Progmem size than the Adafruit PN532
// implementation below and does NOT support recognition of a removed track. Furthermore the user
// has to turn off the box before she can listen to the next album :-(
#ifdef NFCNDEF
  // these includes are sued for the NDEF implementation
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
#ifdef NFCTRACKDB
  // INCLUDE Adafruit NFC LIbrary here
  #include <Wire.h>
  #include <Adafruit_PN532.h>
  //#define PN532_SCK         13    // SPI Clock shared with VS1053, SD card and NFC breakout board 
  //#define PN532_MISO        12    // Input data from VS1053, SD card and NFC breakout board 
  //#define PN532_MOSI        11    // Output data to VS1053, SD card and NFC breakout board 
  #define PN532_SS          10    // NFC breakout board chip select pin
  //Adafruit_PN532 nfc(PN532_SCK, PN532_MISO, PN532_MOSI, PN532_SS);
  Adafruit_PN532 nfc(SCK, MISO, MOSI, PN532_SS);
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
char plrCurrentFolder[]     = "system00";                // directory containing the currently played tracks
char filename[]             = "/system00/track001.mp3";  // path and filename of the track to play
byte firstTrackToPlay       = 1;                         // the track number to play (used for the loop)
char nextTrackToPlay        = 1;                         // the track number to play next (or -1 in case of an error)


// file to hold the last played album (aka directory) name - from here we may retrieve other data from the trackDb 
#ifdef RESUMELAST
  const char resumeLastFile[] = "/trackdb0/LASTPLAY.TDB";
#endif


// trackDb on the SD card - this is where we store the NFC TAG <-> Directory connection and the track to start playback with
// and is the complementary implementation to the NDEF messages on the NFC Tag - see option NFCNDEF
#ifdef NFCTRACKDB
  const char trackDbDir[]   = "/trackdb0"; // where do we store the TrackDB files for each album 
  char trackDbFile[23];                    // path to the file with uid, directory and track
  char trackDbEntry[35];                   // will hold a nfc <-> album info connection 
                                           // in the form of [NFC Tag UID]:[album]:[Track] e.g.: 43322634231761291:larsrent:1

  #ifdef ALBUMNFC
    // a special file that additionally holds the connection between an NFC tag UID and the corresponding directory
    const char albumNfcFile[]  = "/trackdb0/albumnfc.tdb";  
  #endif
  
  // NFC Tag data
  byte uid[] = { 0, 0, 0, 0, 0, 0, 0 };// Buffer to store the returned UID
  char charUid[22];                    // char representation of the UID
  byte uidLength;                      // Length of the UID (4 or 7 bytes depending on ISO14443A card type)
#endif 


// volume control variables for the analog poti
#ifdef VOLUMEPOT
  const byte volPotPin       = A0;    // the analog input pin that we use for the potentiometer
  word lastVolSensorValue    = 0;     // keeps the last read sensor value
#endif


// control buttons definition
#ifdef BUTTONS
  const byte btnLinePin      = A1;    // pin on which the button line (4 buttons) is connected
  
  word btnVal;                        // stores the value we receive on the btnLinePin for comparance with the predefined analog reads for the 4 buttons
  const byte btnValDrift     = 5;     // maximum allowed difference + and - the predefined value for each button we allow
  const word btnPressDelay   = 500;   // delay in milliseconds to prevent double press detection
  unsigned long btnPressTime = 0;     // time in millis() when the button was pressed
  const word btnLightValue   = 1021;  // 33 Ohm  - The value we receive from analog input if the Light On/Off Button is pressed
  const word btnPauseValue   = 933;   // 1K Ohm  - The value we receive from analog input if the Pause Button is pressed
  const word btnNextValue    = 1002;  // 220 Ohm - The value we receive from analog input if the Next (aka Fast Forward) Button is pressed
  const word btnPrevValue    = 991;   // 330 Ohm - The value we receive from analog input if the Previos (aka Prev or Rewind) Button is pressed
  const word minBtnValue     = 800;   // we use this value to determine, whether or not to check the buttons. Set to lower val than smallest of buttons
#endif


// IR remote control 
#ifdef IRREMOTE
  const byte iRRemotePin    = A3;      // the pin the IR remote control diode (receiver) is connected to
  
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
  const byte lowBatPin      = A2;      // pin on which the Adafruit PowerBoost will indicate a low battery
                                       // this pin will usually be pulled high but when the charger detects 
                                       // a low voltage (under 3.2V) the pin will drop down to 0V (LOW)
  unsigned long lowBatCheckTime = 0;   // used to throttle low battery messages to every 5 minutes
#endif


// LIGHT EFFECTS
#ifdef OPRLIGHT
  #ifdef OPRLIGHTTIME
    unsigned long lightStartUpTime = 0; // millis() the operations light started
  #endif
  const byte infoLedPin     = 5;       // the pin to which the operation led is connected to
  boolean lightOn           = true;    // if true, the operations light fader is active. switched via a button, 
                                       // set to false after a maxLightTime (in case of OPRLIGHTTIME) is reached
#endif
const byte warnLedPin       = 8;       // the pin to which the warning led is connected to
const byte errorLedPin      = 9;       // the pin to which the error led is connected to



//
//        PPPPPP    RRRRR     OOOOOO   TTTTTTTT   OOOOOO   TTTTTTTT  YY    YY   PPPPPP    EEEEE   SSSSS
//       PP    PP  RR    RR  OO    OO     TT     OO    OO     TT      YY  YY   PP    PP  EE      SS
//       PPPPPPP   RRRRRRR  OO      OO    TT     OO    OO     TT       YYYY    PPPPPPP   EEEE     SSSSS
//       PP        RR    RR  OO    OO     TT     OO    OO     TT        YY     PP        EE          SS
//       PP        RR    RR   OOOOOO      TT      OOOOOO      TT        YY     PP        EEEEEE  SSSSS
//
boolean createAlbumDbEntry(void);                    // create / update two files on SD to connect NFC Tag UID with a directory name and a track to start playback with
void printTrackDb(void);
void printAlbumData(void);                            // print global vars with data from nfc tag and return true in case tag contains data or false if not
void printDirectory(File, byte);
void deleteFilesFromDir(File);



//
//       SSSSSS  EEEEEE  TTTTTTTT  UU   UU   PPPPP
//      SS       EE         TT     UU   UU  PP   PP
//       SSSSS   EEEE       TT     UU   UU  PPPPPP
//           SS  EE         TT     UU   UU  PP
//      SSSSSS   EEEEEE     TT      UUUUU   PP
//
void setup() {
  // SETUP SERIAL CONSOLE
  #ifdef DEBUG
    // in case we want debug output
    Serial.begin(38400);
  #endif
  #ifdef RAMCHECK
    // or at least print out available RAM
    Serial.begin(38400);
  #endif

  
  // DEFINE INPUT PINs
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
  
    
  // DEFINE OUPUT PINs
  #ifdef OPRLIGHT
    pinMode(infoLedPin, OUTPUT);     // connect to blue LED
  #endif
  pinMode(warnLedPin, OUTPUT);     // connect to orange LED
  pinMode(errorLedPin, OUTPUT);    // connect to a red LED

  
  // INITIALIZE THE MUSIC PLAYER
  if (!musicPlayer.begin()) {
    #ifdef DEBUG
      Serial.println(F("VS1053 Not found"));
    #endif
    // flash the red light to indicate we have an error
    for (;;) { digitalWrite(errorLedPin, HIGH); }
  }
  // This option uses a pin interrupt. No timers required! But DREQ
  // must be on an interrupt pin. For Uno/Duemilanove/Diecimilla
  // that's Digital #2 or #3
  // See http://arduino.cc/en/Reference/attachInterrupt for other pins
  if (! musicPlayer.useInterrupt(VS1053_FILEPLAYER_PIN_INT)) {
    #ifdef DEBUG
      Serial.println(F("No interrupt on DREQ pin"));
    #endif
    for (;;) { digitalWrite(errorLedPin, HIGH); }
  }

  
  // INITIALIZE THE SD CARD
  if (!SD.begin(CARDCS)) {
    #ifdef DEBUG
      Serial.println(F("SD-Card Not found"));
    #endif
    // flash the red light to indicate we have an error
    for (;;) { digitalWrite(errorLedPin, HIGH); }
  } else {
    //printDirectory(SD.open("/"), 1);
    if (!SD.exists(trackDbDir)) SD.mkdir(trackDbDir);
    #ifdef DEBUG
      printDirectory(SD.open("/TRACKDB0"), 1);
      Serial.print(F("\n"));
    #endif
    //deleteFilesFromDir(SD.open(trackDbDir));
    
  }
  
  // START THE NFC READER
  #ifdef NFCNDEF
    // either use the simple one with NDEF support to get the   tag <-> album directory  connection
    nfc.begin();
  #endif
  
  #ifdef NFCTRACKDB
    // or use the Adafruit implementation, which allows for resume and rescan etc. 
    //   but needs the trackDB to get the album directory for a tag as no NDEF messages are supported
    nfc.begin();
    // make sure to comment this out after PN532 is working as it takes approx 290 bytes from progmem
    uint32_t versiondata = nfc.getFirmwareVersion();
    if (! versiondata) {
      #ifdef DEBUG
        Serial.print("Didn't find PN53x board");
      #endif
      for (;;) { digitalWrite(errorLedPin, HIGH); }
    }
    #ifdef DEBUG
      // Got ok data, print it out!
      Serial.print(F("Found chip PN5")); Serial.println((versiondata>>24) & 0xFF, HEX); 
      Serial.print(F("Firmware ver. ")); Serial.print((versiondata>>16) & 0xFF, DEC); 
      Serial.print('.'); Serial.println((versiondata>>8) & 0xFF, DEC);
    #endif
    // configure board to read RFID tags
    nfc.setPassiveActivationRetries(0xFF);
    nfc.SAMConfig();  
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
    Serial.print(PROGRAM);Serial.print(F(" V"));Serial.print(VERSION);Serial.print(F(" - waiting "));
  #endif
}
void setup(void) {
  Serial.begin(38400);

  // initialize the music player
  Serial.print(F("VS1053 "));
  if (! musicPlayer.begin()) {
    Serial.println(F(" Not found"));

    // flash the red light to indicate we have an error
    while (1);
  } else {Serial.println(F("ready"));}
  
  // initialize the SD card
  Serial.print(F("SD-Card "));
  if (!SD.begin(CARDCS)) {
    Serial.println(F("not found"));
    while (1);
  } else {
    Serial.println(F("ready"));
    //printDirectory(SD.open("/"), 1);
    if (!SD.exists(trackDbDir)) SD.mkdir(trackDbDir);
    printDirectory(SD.open("/TRACKDB0"), 1);
    //deleteFilesFromDir(SD.open(trackDbDir));
    Serial.print(F("\n"));
  }

  
  Serial.println(F("NFC TAG READER: "));
  nfc.begin();

  uint32_t versiondata = nfc.getFirmwareVersion();
  if (! versiondata) {
    Serial.print("Didn't find PN53x board");
    while (1); // halt
  } else {
    Serial.print("  Found chip PN5"); Serial.println((versiondata>>24) & 0xFF, HEX); 
    Serial.print("  Firmware ver. "); Serial.print((versiondata>>16) & 0xFF, DEC); 
    Serial.print('.'); Serial.println((versiondata>>8) & 0xFF, DEC);
    nfc.setPassiveActivationRetries(0xFF);
    nfc.SAMConfig();  
  }

  Serial.println(F("\nScan your NFC tag"));
  Serial.println(F("___________________________________________________\n"));
}


void loop(void) {
  boolean success = false;
  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);
  // only in case we detected an NFC tag we go beyond this point
  if (success) {
    // The NTAG203 has a 7 byte UID, so I'll assume that if this tag does, it is the right type of tag. 
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, &uid[0], &uidLength)) {
      //createAlbumDbEntry();
      //printTrackDb();
      Serial.print(F("got tag >> "));
      char tmpbuf[4];                                 // temp buffer for one number of the uid
      for (byte i = 0; i <= uidLength ; i++) {
        sprintf( tmpbuf, "%d", uid[i] );              // print one byte of the uid as decimal into tmpbuf, so
        strcat( charUid, tmpbuf );                    // we can add it to the charUid 
        Serial.print(uid[i]);                         // print for debug
      }
      Serial.println(F(""));
      getDirectoryFromUid(SD.open(trackDbDir));
    } else {
      Serial.println(F("card is gone :-("));
    }
  }
}


void getDirectoryFromUid(File dir) {

  // FIRST possibility:
  //   we open the trackDB file and iterate line by line to get the entry that corresponds to the currently active UID

  // SECOND possibility:
  //   we open each file in the track DB directory (except the global trackDB file) and check if the key matches the given UID
  while (true) {
    File entry =  dir.openNextFile();
    
    // no more files
    if (!entry) {
      break;
    }
    Serial.print(F("working on entry "));Serial.println(entry.name());
    
    // we only want to check the files with a single entry - not the global trackDB file with all entries
    //if (!entry.name() == "ALBUMNFC.TXT" && !entry.isDirectory()) {
      while (entry.available()){
        char b = entry.read();
        Serial.print(b);
      }
      Serial.println(F(""));

      char payload[30];
      byte idx = 0;
      bool EOL = false;
      while (!EOL){
        char c = entry.read();      // reads 1 char from SD
        if (c == '\n' || idx==19) { // prevent buffer overflow too..
          payload[idx] = 0;
          idx = 0;
          EOL = true;
        } else {
          payload[idx] = c;
          idx++;
        }
      }
          
      char* p;                                          // this is where we store the result of strtok()
      p = strtok((char *)payload, ":");                 // separate payload on :-delimiter as it's form is like this:  46722634231761290:findorie:1
      Serial.print(F("1st the UID::"));Serial.println(p);
      p = strtok(NULL, ":");                            // we only need the second entry and strtok() expects NULL for string on subsequent calls
      Serial.print(F("2nd the directory::"));Serial.println(p);
      p = strtok(NULL, ":");                            // we only need the second entry and strtok() expects NULL for string on subsequent calls
      Serial.print(F("3rd the track::"));Serial.println(p);
            //memset(plrCurrentFolder, 0, sizeof(plrCurrentFolder));
            //memcpy(plrCurrentFolder, p, 8);               // copy directory from tag into global player var - so we know which dir to play files from
            //byte i;
            //i = atoi(p);
            //firstTrackToPlay = i;                         // copy track number to firstTrackToPlay - so we know where to start the playback
        
      Serial.println(F("")); 
    //}
    entry.close();
  } // end while
  
/*
      byte payloadLength = record.getPayloadLength();   // get length of record
      byte payload[payloadLength];                      // initialise payload variable to store content of record
      record.getPayload(payload);                       // extract the payload of this record
      char* p;                                          // this is where we store the result of strtok()
      
      p = strtok((char *)payload, " ");                 // separate payload on space-delimiter as it's form is like this:  en bluemc99   or equivalent
      p = strtok(NULL, " ");                            // we only need the second entry and strtok() expects NULL for string on subsequent calls
      switch (i) {
        case 0:
          success = true;
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
*/
}

void extractAlbumDbEntry() {
  char tmpbuf[4];                                 // temp buffer for one number of the uid
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

boolean createAlbumDbEntry() {
  boolean success = false;
  byte bytesWritten;
  char tmpbuf[4];                                 // temp buffer for one number of the uid
  
  // create the entry for the  "Tag UID <-> directory + track number"  connection
  memset(trackDbEntry, 0, sizeof(trackDbEntry));
  Serial.print(F("writing nfc <-> album connection to disk >> "));
  for (byte i = 0; i <= uidLength ; i++) {
    sprintf( tmpbuf, "%d", uid[i] );              // print one byte of the uid as decimal into tmpbuf, so
    strcat( charUid, tmpbuf );                    // we can add it to the charUid 
    Serial.print(uid[i]);                         // print for debug
  }
  Serial.print(F(":"));
  Serial.print(plrCurrentFolder);
  Serial.println(F("\n"));
  
  memcpy(trackDbEntry, charUid, sizeof(charUid)); // finally we add the charUid to the trackDbENtry 
  strcat(trackDbEntry, ":");                      // add a seperator :
  strcat(trackDbEntry, plrCurrentFolder);         // the folder of the album this tag is connected with
  char cstr[4];                                   // a new char array that will hold firstTrackToPlay as a char array
  itoa(firstTrackToPlay, cstr, 10);               // converting firstTrackToPlay to char and place it in cstr
  strcat(trackDbEntry, ":");                      // and the number of the track
  strcat(trackDbEntry, cstr);                     // and the number of the track
  strcat(trackDbEntry, "\n");                     // and a newline :-)

  // FIRST write the trackDbFile --> ALBUMNFC.TXT
  File file = SD.open(trackDbFile, FILE_WRITE);
  bytesWritten = file.write(trackDbEntry, sizeof(trackDbEntry));
  file.close();                                   // and make sure everything is clean and save
  if (bytesWritten == sizeof(trackDbEntry)) {
    Serial.print(F("successfully wrote "));
    success = true; 
  } else {
    Serial.print(F("could not write the "));
    success = false;
  }
  Serial.print(bytesWritten);Serial.print(F(" byte(s) to file "));Serial.println(trackDbFile);

  
  // SECOND write the tDirFile --> e.g. larsrent.txt
  memset(tDirFile, 0, sizeof(tDirFile));          // make sure var to hold path to track db file is empty
  strcat(tDirFile, trackDbDir);                   // add the trackDb Directory to the 
  strcat(tDirFile, "/");                          // a / 
  strcat(tDirFile, plrCurrentFolder);             // and the filename
  strcat(tDirFile, ".txt");                       // plus of course a txt extension
  SD.remove(tDirFile);                            // we want the file to be empty prior writing directory and track to it, so we remove it
  file = SD.open(tDirFile, FILE_WRITE);      // and now we open / create it
  bytesWritten = file.write(trackDbEntry, sizeof(trackDbEntry));
  file.close();                                   // and make sure everything is clean and save
  if (bytesWritten == sizeof(trackDbEntry)) {
    Serial.print(F("successfully wrote "));
    success = true; 
  } else {
    Serial.print(F("#fail: only wrote "));
    success = false;
  }
  Serial.print(bytesWritten);Serial.print(F(" byte(s) to file "));Serial.println(tDirFile);

  return (success);
}

void printTrackDb() {
  // FIRST we print the complete trackDB 
  //   a file in which all tag <-> directory connections are stored as key:value:value tripples 
  //   with a structure like this: 46722634231761290:findorie:1
  if (!SD.exists(trackDbFile)) {
    Serial.println(F("no trackDb entry found"));     // check if the trackDb file exists and if not issue a warning
  } else {
    Serial.print(F("content of file "));Serial.print(trackDbFile);Serial.println(F(": "));
    File file = SD.open(trackDbFile, FILE_READ);
    while (file.available()){
      char b = file.read();
      Serial.print(b);
    }
    Serial.println(F(""));
  }

  // SECOND we print the individual file that is named after the directory 
  //   it holds the same key:value:value tripple as the trackDb file
  //   with a structure like this: 46722634231761290:findorie:1
  memset(tDirFile, 0, sizeof(tDirFile));          // make sure the var to hold the path to the file is empty
  strcat(tDirFile, trackDbDir);                   // add the trackDb Directory
  strcat(tDirFile, "/");                          // and a trailing / 
  strcat(tDirFile, plrCurrentFolder);             // plus the filename of the currently played album
  strcat(tDirFile, ".txt");                       // plus of course the .txt extension
  
  if (!SD.exists(tDirFile)) {
    Serial.println(F("no album info found"));     // check if the album info file exists and if not issue a warning
  } else {
    Serial.print(F("content of file "));Serial.print(tDirFile);Serial.print(F(": "));
    File file = SD.open(tDirFile, FILE_READ);
    while (file.available()){
      char b = file.read();
      Serial.print(b);
    }
  }
  Serial.println(F("\n"));
}

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
}

void deleteFilesFromDir(File dir) {
  Serial.print(F("deleting "));
  while (true) {
    File entry =  dir.openNextFile();
    // no more files
    if (! entry) {
      break;
    }
    
    if (!entry.isDirectory()) {
      char filename[23];
      memcpy(filename, trackDbDir, sizeof(trackDbDir));
      strcat(filename, "/");
      strcat(filename, entry.name());
      Serial.print(filename);
      if (!SD.remove(filename)) Serial.print(F(" failed ")); else Serial.print(F(" "));
    }
    entry.close();
  } // end while
}

