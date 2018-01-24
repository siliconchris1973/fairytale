// make sure to change this to false before uploading in production as it turns on lots and lots of serial messages
boolean DEBUG = true;

//
// include SPI and SD libraries
//
#include <SPI.h>
//#include <SD.h>

//
// SETUP MP3
// 

#include <Adafruit_VS1053.h>
// These are the pins used for the music maker shield
#define SHIELD_RESET  -1    // VS1053 reset pin (unused!)
#define SHIELD_CS      7    // VS1053 chip select pin (output)
#define SHIELD_DCS     6    // VS1053 Data/command select pin (output)
#define CLK           13    // SPI Clock, shared with SD card
#define MISO          12    // Input data, from VS1053/SD card
#define MOSI          11    // Output data, to VS1053/SD card
// These are common pins between breakout and shield
#define CARDCS         4    // Card chip select pin
// DREQ should be an Int pin, see http://arduino.cc/en/Reference/attachInterrupt
#define DREQ           3    // VS1053 Data request, ideally an Interrupt pin
// Create shield object
Adafruit_VS1053_FilePlayer musicPlayer = Adafruit_VS1053_FilePlayer(SHIELD_RESET, SHIELD_CS, SHIELD_DCS, DREQ, CARDCS);


//
// setup NFC Adapter
//
/*
  
// Adafruit Library with SPI 
#include <Wire.h>             // low level communication
#include <Adafruit_PN532.h>   // PN532 library from Adafruit
#include <NfcTag.h>           // represents an NFC tag
#define PN532_SCK  (13)
#define PN532_MISO (12)
#define PN532_MOSI (11)
#define PN532_SS   (10)
Adafruit_PN532 nfc(PN532_SS);

*/



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


/*
// Seedmaster Library with I2C
#include <Wire.h>
#include <PN532_I2C.h>
#include <PN532.h>
#include <NfcAdapter.h>
#define PN532_IRQ 2
#define PN532_RESET 9
PN532_I2C pn532_i2c(Wire);
NfcAdapter nfc = NfcAdapter(pn532_i2c);
*/

/*
// Seedmaster Library with HSU
//#include <Serial.h>
#include <PN532_HSU.h>
#include <PN532.h>
#include <NfcAdapter.h>
//#define PN532_IRQ 2
//#define PN532_RESET 8
PN532_HSU pn532_hsu(Serial);
NfcAdapter nfc = NfcAdapter(pn532_hsu);
*/


// mp3 player variables
boolean plrStartPlaying = false;              // Is set to true in case an nfc tag is present with information on tracks to play
char plrCurrentFile[13] = "schrott1.mp3";     // which track is the player playing?
char plrCurrentFolder[9] = "schrott1";        // from which directory is the player playing?
char filename[23] = "/schrott1/schrott1.mp3"; // path and filename of the track to play
byte firstTrackToPlay = 0;                    // the track number as received from the tag
char curTrackCharNumber[4] = "000";           // used to create the filename by converting 1 to 001 etc.



// NFC Tag data
byte uid[] = { 0, 0, 0, 0, 0, 0, 0 };    // Buffer to store the returned UID
byte uidLength;                          // Length of the UID (4 or 7 bytes depending on ISO14443A card type)


void setup(void) {
  Serial.begin(38400);
  Serial.println(F("NFC TAG READER: "));
  nfc.begin();
  Serial.println(F("\nScan your NFC tag"));
  Serial.println(F("___________________________________________________\n"));
}

boolean getNfcCardData(void);

void loop(void) {
  boolean success = false;
  success = nfc.tagPresent();
  
  // only in case we detected an NFC tag we go beyond this point
  if (success) {
    Serial.println(F("NFC tag Found!\n"));
    Serial.println(F("current global var values:"));
    Serial.print(F("  Directory: "));Serial.println(plrCurrentFolder);
    Serial.print(F("  Track: "));Serial.println(firstTrackToPlay);
    
    //plrStartPlaying = getNfcCardData();
    getNfcCardData();
    if (plrStartPlaying) {
      Serial.println(F("successfully extracted data from card"));
      Serial.print(F("  Directory: "));Serial.println(plrCurrentFolder);
      Serial.print(F("  Track: "));Serial.println(firstTrackToPlay);
      if (firstTrackToPlay > 9) {
        Serial.print(F("Now setting firstTrackToPlay back to 1 and writing back to tag ... "));
        firstTrackToPlay=1; 
      } else { 
        firstTrackToPlay = firstTrackToPlay+1; 
        Serial.print(F("Now increasing firstTrackToPlay to "));Serial.print(firstTrackToPlay);Serial.print(F(" and writing back to tag ... "));
      }
      if (writeNfcCardData()) {
        Serial.println(F("SUCCESS!"));
      } else {
        Serial.println(F("FAILURE!"));
      }
    } else {
      Serial.print(F("DID NOT RECEIVE NECESSARY DATA TO PLAY ALBUM"));
      /*
      if (writeNfcCardData) {
        Serial.println(F("SUCCESS!"));
      } else {
        Serial.println(F("FAILURE!"));
      }
      */
    }
    delay(2000);
    // Wait a bit before trying again
    Serial.println(F("\n\nSend a character to scan another tag!"));
    Serial.flush();
    while (!Serial.available());
    while (Serial.available()) {
      Serial.read();
    }
    Serial.flush(); 
  }
}

boolean getNfcCardData() {
  //NfcTag tag = NfcTag(uid, sizeof(uid));
  NfcTag tag = nfc.read();
  if (DEBUG) { Serial.print(F("Tag Type: ")); Serial.println(tag.getTagType()); Serial.print(F("UID: ")); Serial.println(tag.getUidString()); }

  if (tag.hasNdefMessage()) {
    NdefMessage message = tag.getNdefMessage();

    // If you have more than 1 Message then it will cycle through them
    for (byte i = 0; i < message.getRecordCount(); i++) {
      NdefRecord record = message.getRecord(i);
      
      byte payloadLength = record.getPayloadLength();     // get length of record
      byte payload[payloadLength];                        // initialise payload variable to store content of record
      record.getPayload(payload);                         // extract the payload of this record
      char* p;                                            // this is where we store the result of strtok()

      p = strtok((char *)payload, " ");                   // separate payload on space-delimiter as it's form is like this:  en bluemc99   or equivalent
      p = strtok(NULL, " ");                              // we only need the second entry and strtok() expects NULL for string on subsequent calls
      if (DEBUG) {Serial.print(F("Found record "));Serial.print(i);Serial.print(F(" with p being "));Serial.print(p);Serial.print(F(" and a size of "));Serial.println(payloadLength);}
      switch (i) {
        case 0:
          plrStartPlaying = true;
          memset(plrCurrentFile, 0, sizeof(plrCurrentFile));
          //strcpy(plrCurrentFolder, p);                    // copy directory from tag into global player var - so we know which dir to play files from
          memcpy(plrCurrentFolder, p, 8);
          break;
        case 1:
          byte i;
          i = atoi(p);
          firstTrackToPlay = i;
          Serial.print(F("firstTrackToPlay = "));Serial.println(firstTrackToPlay);
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
  boolean success = false;                          // in case writing was successfull, this is returned as true
    
  if (nfc.tagPresent()) {
    char tDir[10] = " ";                            // a new char array to initially hold a space. next we concatenate plrCurrentFolder
    strcat(tDir, plrCurrentFolder);                 // the final tDir contains a space followed by the plrCurrentFolder
    char tTrack[5] = " ";
    char cstr[4];
    itoa(firstTrackToPlay, cstr, 10);
    strcat(tTrack, cstr);
    Serial.print(F("about to write directory :"));Serial.print(tDir);Serial.print(F("! and track number :"));Serial.print(tTrack);Serial.println(F("! to tag"));
    NdefMessage message = NdefMessage();
    message.addTextRecord(tDir);                    // In which directory are the files
    message.addTextRecord(tTrack);                  // Which Track did we play last

    // Wait a bit before trying again
    Serial.println("Send a character to write the tag!");
    Serial.flush();
    while (!Serial.available());
    while (Serial.available()) {
      Serial.read();
    }
    Serial.flush();
    success = nfc.write(message);
  }
  
  return (success);
}
