#define VERSION 3

// BOF preprocessor bug prevent - insert me on top of your arduino-code
#if 1
__asm volatile ("nop");
#endif

// set according to the baudrate of your serial console. used for debugging output
#define BAUDRATE 115200

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
#define TRACEOUT 1
// to enable periodic output of free RAM during playBack, uncomment the following line.
//#define RAMCHECK 1


//
// turn ON / OFF certain hardware/software features
//
// to enable the 8x8 LED Matrix uncomment the next
#define LEDMATRIX 1


#define ADAFRUIT_PN532 1

// Define the NFC <-> Album implementation
// to use the Adafruit NFC library to get the Tag UID and retrieve the directory from the trackDb 
// uncomment the following line. 
#define NFCTRACKDB 1

// uncomment to enable a special file albumnfc.tdb in which all album <-> nfc connections are stored 
// this is an additional storage to the individual TrackDb files and requires NFCTRACKDB 
//#define ALBUMNFC 1

// uncomment the next line to enable resuming the last played album on switch on
// this is achieved via a special file on the SD card and works without a tag but uses the pause/resume button instead
//#define RESUMELAST 1


// uncomment the next line to activate the VS1053 Component on the Music Maker Shield - aka the MP3 Player
//#define VS1053 1

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
#include <SD.h>



//
// SETUP MUSIC MAKER SHIELD
// 
#ifdef ADAFRUIT_PN532
  #include <Adafruit_VS1053.h>
  // These are the pins used for the music maker shield
  #define SHIELD_RESET     (-1)    // VS1053 reset pin (unused!)
  #define SHIELD_CS         (7)    // VS1053 chip select pin (output)
  #define SHIELD_DCS        (6)    // VS1053 Data/command select pin (output)
  
  //
  // SETUP SD CARD
  //
  // These are common pins between breakout and shield
  #define CARDCS            (4)    // Card chip select pin
  // DREQ should be an Int pin, see http://arduino.cc/en/Reference/attachInterrupt
  #define DREQ              (3)    // VS1053 Data request, ideally an Interrupt pin
  // Create shield object
  Adafruit_VS1053_FilePlayer musicPlayer = Adafruit_VS1053_FilePlayer(SHIELD_RESET, SHIELD_CS, SHIELD_DCS, DREQ, CARDCS);
#endif

//
// SETUP NFC ADAPTER
//
// this implementation uses the Adafruit PN532 library alone - it is way smaller and preferrable
// as it allows for tag removal recognition and does not enforce the user to turn off the box
// after an album was played, as the above implementation does.
#ifdef ADAFRUIT_PN532
  // INCLUDE Adafruit NFC LIbrary here
  #include <Wire.h>
  #include <Adafruit_PN532.h>

  
  #define PN532_SCK         (13)    // SPI Clock shared with VS1053, SD card and NFC breakout board 
  #define PN532_MISO        (12)    // Input data from VS1053, SD card and NFC breakout board 
  #define PN532_MOSI        (11)    // Output data to VS1053, SD card and NFC breakout board 
  #define PN532_SS          (10)    // NFC breakout board chip select pin
  //Adafruit_PN532 nfc(PN532_SCK, PN532_MISO, PN532_MOSI, PN532_SS);
  // SCK = 13, MOSI = 11, MISO = 12.  The SS line can be any digital IO pin.
  Adafruit_PN532 nfc(PN532_SS);
#endif


//
// include 8x8 LED MAtrix
//
#ifdef LEDMATRIX
  #include <LedControl.h>
  
  #define MATRIX_DIN (9)              // DIN pin of MAX7219 module
  #define MATRIX_CLK (5)              // CLK pin of MAX7219 module
  #define MATRIX_CS  (8)              // CS  pin of MAX7219 module
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


// trackDb on the SD card - this is where we store the NFC TAG <-> Directory connection and the track to start playback with
// and is the complementary implementation to the NDEF messages on the NFC Tag - see option NFCNDEF
#ifdef NFCTRACKDB
  const char trackDbDir[]    = "/trackdb0"; // where do we store the TrackDB files for each album 
  char trackDbFile[23];                     // path to the file with uid, directory and track
  char trackDbEntry[35];                    // will hold a nfc <-> album info connection 
                                            // in the form of [NFC Tag UID]:[album]:[Track] e.g.: 43322634231761291:larsrent:1

  // a special file that additionally holds the connection between an NFC tag UID and the corresponding directory
  const char albumNfcFile[] = "/trackdb0/albumnfc.tdb";  

  // file to hold the last played album (aka directory) name - from here we may retrieve other data from the trackDb 
  const char resumeLastFile[] = "/trackdb0/LASTPLAY.TDB";
  
  // NFC Tag data
  byte uid[] = { 0, 0, 0, 0, 0, 0, 0 };// Buffer to store the returned UID
  char charUid[22];                    // char representation of the UID
  byte uidLength;                      // Length of the UID (4 or 7 bytes depending on ISO14443A card type)
#endif 


#ifdef LEDMATRIX
  const uint64_t IMAGES[] PROGMEM = {
                  0x3c4299a581a5423c,   //  Happy Smiley
                  0x003e22222a2a1e00,   //  Error writing / reading to / from SD 
                  0x3c42a59981a5423c,   //  Sad Smiley
                  0xff0072856515e500,   //  NOVS1053 - VS1053 Not found
                  0xff0000555d5df500,   //  NOINT - No interrupt on DREQ pin
                  //0x0036363636363600,   //  Pause
                  //0x0000cc663366cc00,   //  Previous
                  0x00003366cc663300,   //  Next
                  //0x000c1c3c7c3c1c0c,   //  Play
                  0x007e425a5a527600,   //  NOPN53 - Didn't find PN53x board
                  //0x060e0c0808281800,   //  NOTE1
                  //0x066eecc88898f000,   //  NOTE2
                  //0x00082a1c771c2a08,   //  SONNE
                  //0x10387cfefeee4400,   //  HEART
                  //0x00496b5d5d6b4914,   //  Butterfly 1
                  //0x00082a3e3e2a0814,   //  Butterfly 2
                  0x1800183860663c00,   //  QUESTION
                  //0x0088acafafac8800,   //  Volume UP
                  //0x00088cafaf8c0800,   //  Volume DOWN
                  //0xffffbb2f2a0a0808,   //  EQ1
                  //0xffdffa5c5a480800,   //  EQ2
                  //0xfffbf3b292900000,   //  EQ3
                  //0xffeeeea6e2a20000,   //  EQ4
                  //0xffefaf868a820000,   //  EQ5
                  //0xffefee6a68602000,   //  EQ6
                  //0xffefca4a08000000,   //  EQ7
                  //0xffeec44000000000,   //  EQ8
                  //0xffeeecc480808000,   //  EQ9
                  0x013e262a32324e80   //  NO SD CARD
                  //0x1818245a5a241800    //  Light
                  
                  
  };

  // for easiere selction of the images these constants can be used
  #define HAPPY       (0)
  #define SADSD       (1)
  #define SAD         (2)
  #define NOVS1053    (3)
  #define NOINT       (4)
  //#define PAUSE       (5)
  //#define PREVIOUS    (6)
  #define NEXT        (5)
  //#define PLAY        (8)
  #define NOPN53      (6)
  //#define NOTE1       (10)
  //#define NOTE2       (11)
  //#define SONNE       (12)
  //#define HEART       (13)
  //#define BFLY1       (14)
  //#define BFLY2       (15)
  #define QUESTION    (7)
  //#define VOLUMEUP    (17)
  //#define VOLUMEDOWN  (18)
  //#define EQ1         (19)
  //#define EQ2         (20)
  //#define EQ3         (21)
  //#define EQ4         (22)
  //#define EQ5         (23)
  //#define EQ6         (24)
  //#define EQ7         (25)
  //#define EQ8         (26)
  //#define EQ9         (27)
  #define NOSDCARD    (8)
  //#define LIGHT       (29)
  
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
void getDirectoryFromUid(File);
void extractAlbumDbEntry(void);
void createAlbumDbEntry(void);
boolean writeAlbumNfc(void);
boolean writeTrackDbFile(void);
void printAlbumNfc(void);
void printDirectory(File, byte);
void deleteFilesFromDir(File);

#ifdef LCDMATRIX
static void displayStuff(int);                  // this is used to display smileys and the like on the 8x8 LED Matrix
void displayImage(uint64_t);
#endif

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
    Serial.begin(BAUDRATE);
    Serial.print(F("searchTrackDB v"));Serial.println(VERSION);
  #endif
  #ifdef RAMCHECK
    // or at least print out available RAM
    Serial.begin(38400);
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
  #ifdef VS1053
    if (!musicPlayer.begin()) {
      #ifdef DEBUG
        Serial.println(F("VS1053 Not found"));
      #endif
      #ifdef LEDMATRIX
        displayStuff(NOVS1053);
      #endif
      for (;;) { delay(1000); }
    }else {
      #ifdef TRACEOUT
        Serial.println(F("VS1053 music player setup"));
      #endif
    }
    
    // This option uses a pin interrupt. No timers required! But DREQ
    // must be on an interrupt pin. For Uno/Duemilanove/Diecimilla
    // that's Digital #2 or #3
    // See http://arduino.cc/en/Reference/attachInterrupt for other pins
    if (! musicPlayer.useInterrupt(VS1053_FILEPLAYER_PIN_INT)) {
      #ifdef DEBUG
        Serial.println(F("No interrupt on DREQ pin"));
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
  #endif
  
  // INITIALIZE THE SD CARD
  #ifdef SDCARD
    if (!SD.begin(CARDCS)) {
      #ifdef DEBUG
        Serial.println(F("SD-Card Not found"));
      #endif
      #ifdef LEDMATRIX
        displayStuff(NOSDCARD);
      #endif
      for (;;) { delay(1000); }
    } else {
      #ifdef TRACEOUT
        Serial.println(F("SD Card reader initialized"));
      #endif
      #ifdef NFCTRACKDB
        #ifdef TRACEOUT
          Serial.println(F("content of SD Card"));
          printDirectory(SD.open("/"), 1);
        #endif
        if (!SD.exists(trackDbDir)) {
          #ifdef DEBUG
            Serial.print(F("creating trackDB Dir "));
          #endif
          #ifdef TRACEOUT
            Serial.print(trackDbDir);
          #endif
          #ifdef DEBUG
            Serial.print(F("\n"));
          #endif
          SD.mkdir(trackDbDir);
        }
        #ifdef TRACEOUT
          Serial.print(F("content of TrackDB Dir "));Serial.println(trackDbDir);
          printDirectory(SD.open(trackDbDir), 1);
          Serial.print(F("\n"));
        #endif
        //deleteFilesFromDir(SD.open(trackDbDir));
      #endif
    }
  #endif
  
   
  // START THE NFC READER
  
  #ifdef ADAFRUIT_PN532
    // or use the Adafruit implementation, which allows for resume and rescan etc. 
    //   but needs the trackDB to get the album directory for a tag as no NDEF messages are supported
    nfc.begin();
    // make sure to comment this out after PN532 is working as it takes approx 290 bytes from progmem
    uint32_t versiondata = nfc.getFirmwareVersion();
    if (! versiondata) {
      #ifdef DEBUG
        Serial.print("Didn't find PN53x board");
      #endif
      #ifdef LEDMATRIX
        displayStuff(NOPN53);
      #endif
      for (;;) { delay(1000); }
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
  
  // check our current time, so we know when to stop
  //startUpTime = millis();
  #ifdef DEBUG
    Serial.print(F("searchTrackDb V"));Serial.println(VERSION);
    Serial.println(F("\nScan your NFC tag"));
    Serial.println(F("___________________________________________________\n"));
  #endif
  #ifdef LEDMATRIX
    displayStuff(HAPPY);
  #endif
}


void loop(void) {
  boolean success = false;
  #ifdef NFCTRACKDB
    success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);
  #endif
  // only in case we detected an NFC tag we go beyond this point
  if (success) {
    // The NTAG203 has a 7 byte UID, so I'll assume that if this tag does, it is the right type of tag. 
    #ifdef NFCTRACKDB
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
    #endif
  }
  // Wait a bit before trying again
  #ifdef DEBUG
    Serial.println("\n\nSend a character to scan another tag!");
    Serial.flush();
    while (!Serial.available());
    while (Serial.available()) {
      Serial.read();
    }
    Serial.flush();  
  #endif
}

#ifdef NFCTRACKDB
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
    if (!strcmp(entry.name(),albumNfcFile) && !strcmp(entry.name(),resumeLastFile) && !entry.isDirectory()) {
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
    } // end of if file is NOT albumnfc and NOT a directory
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
#endif 

#ifdef NFCTRACKDB
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
#endif

#ifdef NFCTRACKDB
void createAlbumDbEntry() {
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
}
#endif

#ifdef ALBUMNFC
boolean writeAlbumNfc() {
  byte bytesWritten;
  boolean success = false;
  
  // write the albumNfcFile --> ALBUMNFC.TXT
  File file = SD.open(albumNfcFile, FILE_WRITE);
  bytesWritten = file.write(trackDbEntry, sizeof(trackDbEntry));
  file.close();                                   // and make sure everything is clean and save
  if (bytesWritten == sizeof(trackDbEntry)) {
    Serial.print(F("successfully wrote "));
    success = true; 
  } else {
    Serial.print(F("could not write the "));
    success = false;
  }
  Serial.print(bytesWritten);Serial.print(F(" byte(s) to file "));Serial.println(albumNfcFile);
  return(success)
}
#endif

#ifdef NFCTRACKDB
boolean writeTrackDbFile() {
  byte bytesWritten;
  boolean success = false;
  // write the trackDbFile --> e.g. larsrent.txt
  memset(trackDbFile, 0, sizeof(trackDbFile));          // make sure var to hold path to track db file is empty
  strcat(trackDbFile, trackDbDir);                   // add the trackDb Directory to the 
  strcat(trackDbFile, "/");                          // a / 
  strcat(trackDbFile, plrCurrentFolder);             // and the filename
  strcat(trackDbFile, ".txt");                       // plus of course a txt extension
  SD.remove(trackDbFile);                            // we want the file to be empty prior writing directory and track to it, so we remove it
  File file = SD.open(trackDbFile, FILE_WRITE);      // and now we open / create it
  bytesWritten = file.write(trackDbEntry, sizeof(trackDbEntry));
  file.close();                                   // and make sure everything is clean and save
  if (bytesWritten == sizeof(trackDbEntry)) {
    Serial.print(F("successfully wrote "));
    success = true; 
  } else {
    Serial.print(F("#fail: only wrote "));
    success = false;
  }
  Serial.print(bytesWritten);Serial.print(F(" byte(s) to file "));Serial.println(trackDbFile);

  return (success);
}
#endif

#ifdef ALBUMNFC
void printAlbumNfc() {
  // print the albumNfcFile --> this contains all trackDb file entries in one file line by line
  //   a file in which all tag <-> directory connections are stored as key:value:value tripples 
  //   with a structure like this: 46722634231761290:findorie:1
  if (!SD.exists(albumNfcFile)) {
    Serial.println(F("no albumNfc found"));     // check if the albumNfc file exists and if not issue a warning
  } else {
    Serial.print(F("content of file "));Serial.print(albumNfcFile);Serial.println(F(": "));
    File file = SD.open(albumNfcFile, FILE_READ);
    while (file.available()){
      char b = file.read();
      Serial.print(b);
    }
    Serial.println(F(""));
  }
}
#endif

#ifdef NFCTRACKDB
void printTrackDb() {
  // SECOND we print the individual file that is named after the directory 
  //   it holds the same key:value:value tripple as the trackDb file
  //   with a structure like this: 46722634231761290:findorie:1
  memset(trackDbFile, 0, sizeof(trackDbFile));          // make sure the var to hold the path to the file is empty
  strcat(trackDbFile, trackDbDir);                   // add the trackDb Directory
  strcat(trackDbFile, "/");                          // and a trailing / 
  strcat(trackDbFile, plrCurrentFolder);             // plus the filename of the currently played album
  strcat(trackDbFile, ".txt");                       // plus of course the .txt extension
  
  if (!SD.exists(trackDbFile)) {
    Serial.println(F("no album info found"));     // check if the album info file exists and if not issue a warning
  } else {
    Serial.print(F("content of file "));Serial.print(trackDbFile);Serial.print(F(": "));
    File file = SD.open(trackDbFile, FILE_READ);
    while (file.available()){
      char b = file.read();
      Serial.print(b);
    }
  }
  Serial.println(F("\n"));
}
#endif

#ifdef DEBUG
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
#endif

#ifdef NFCTRACKDB
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
#endif


#ifdef LEDMATRIX
static void displayStuff(int i){
    memcpy_P(&image, &IMAGES[i], 8);
    displayImage(image);
}

void displayImage(uint64_t image) {
    for (int i = 0; i < 8; i++) {
      byte row = (image >> i * 8) & 0xFF;
      for (int j = 0; j < 8; j++) {
        ledmatrix.setLed(0, i, j, bitRead(row, j));
      }
    }
}
#endif
