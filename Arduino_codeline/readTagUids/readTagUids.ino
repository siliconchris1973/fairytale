// make sure to change this to false before uploading in production as it turns on lots and lots of serial messages
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
#include <PN532_SPI.h>
#include <PN532.h>

#define PN532_SCK     13
#define PN532_MISO    12
#define PN532_MOSI    11
#define PN532_SS      10
PN532_SPI pn532spi(SPI, PN532_SS);
PN532 nfc(pn532spi);


// mp3 player variables
/* 
  TrackDB:
  46722634231761290:findorie:1
        43322634231761290:larsrent:1
        45922634231761290:froschko:1
        415222134231761280:goldgans:1
       48522534231761290:infomsg0:1
        416922234231761280:bluemc59:1
       48422634231761290:rirost13:1
        44122634231761290:rasocke1:1
        414422134231761280:kinderli:1
       416222134231761280:bluemc99:1
       413622134231761280:larswalb:1
       412922034231761280:findnemo:1
       45122634231761290:frederi1:1
        47522634231761290:qqualle1:1
        49322534231761290:klenbaer:1
        49222634231761290:fndstort:1
        49522034231761280:fndszelt:1
        410322034231761280:jkwild13:1
       411322034231761280:kokosnil:1
       412922034231761280:findnemo:1
       412122034231761280:lieselot:1
  
    KINDERLI.TXT    35
    FINDORIE.TXT    35
    LARSRENT.TXT    35
    LARSWALB.TXT    35
    FINDNEMO.TXT    35
    RIROST13.TXT    35
    QQUALLE1.TXT    35
    INFOMSG0.TXT    35
    RASOCKE1.TXT    35
    FREDERI1.TXT    35
    ALBUMNFC.TXT    735
    BLUEMC59.TXT    35
    FROSCHKO.TXT    35
    GOLDGANS.TXT    35
    BLUEMC99.TXT    35
    KLENBAER.TXT    35
    FNDSTORT.TXT    35
    FNDSZELT.TXT    35
    JKWILD13.TXT    35
    KOKOSNIL.TXT    35
    LIESELOT.TXT    35

*/
char plrCurrentFolder[9] = "lieselot";               // from which directory is the player playing?
byte firstTrackToPlay    = 1;                        // the track number as received from the tag


// file system and SD structure variables
char trackDbDir[10]      = "/trackdb0";              // where do we store the files for each album 
char trackDbFile[23]     = "/trackdb0/albumnfc.txt"; // path to the file that holds the connection between an NFC tag UID and the corresponding directory / file name
char tDirFile[23];                                   // a char array to hold the path to the file with track and directory infos (name is shared with directory name plus .txt
char trackDbEntry[35];                               // will hold a nfc <-> album info connection in the form of [NFC Tag UID]:[album] e.g.: 43322634231761291:larsrent


// NFC Tag data
byte uid[]               = { 0, 0, 0, 0, 0, 0, 0 };  // Buffer to store the returned UID
char charUid[22];                                    // char representation of the UID
byte uidLength;                                      // Length of the UID (4 or 7 bytes depending on ISO14443A card type)


boolean writeTrackDbEntry(void);                    // create / update two files on SD to connect NFC Tag UID with a directory name and a track to start playback with
void printTrackDb(void);
void printAlbumData(void);                            // print global vars with data from nfc tag and return true in case tag contains data or false if not
void printDirectory(File, byte);
void deleteFilesFromDir(File);

boolean success = false;
boolean msgShown = false;
boolean tagShown = false;

void setup(void) {
  Serial.begin(115200);

  
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
}


void loop(void) {
  if (!msgShown) {
    msgShown = true;
    Serial.println(F("\nScan your NFC tag"));
    Serial.println(F("___________________________________________________\n"));
  }
  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);
  // only in case we detected an NFC tag we go beyond this point
  if (success) {
    // The NTAG203 has a 7 byte UID, so I'll assume that if this tag does, it is the right type of tag. 
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, &uid[0], &uidLength)) {
      if (!tagShown) {
        tagShown = true;
        Serial.print(F("got tag >> "));
        char tmpbuf[4];                                 // temp buffer for one number of the uid
        for (byte i = 0; i <= uidLength ; i++) {
          sprintf( tmpbuf, "%d", uid[i] );              // print one byte of the uid as decimal into tmpbuf, so
          strcat( charUid, tmpbuf );                    // we can add it to the charUid 
          Serial.print(uid[i]);                         // print for debug
        }
        Serial.println(F(""));
      }
    } /*else {
      msgShown = false;
      tagShown = false;
      Serial.println(F("card is gone"));
    }*/
  }
}
