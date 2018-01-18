#define DEBUG 1
/*
 * Functional variant to read NFC tags and stored NDEF messages
*/
#include <Wire.h>
#include <PN532_I2C.h>
#include <PN532.h>   // The following files are included in the libraries Installed
#include <NfcAdapter.h>

#define PN532_IRQ 2
#define PN532_RESET 8
PN532_I2C pn532_i2c(Wire);
NfcAdapter nfc = NfcAdapter(pn532_i2c);  // Indicates the Shield you are using

/*
#include <SPI.h>
#include <PN532_SPI.h>
#include <PN532.h>
#include <NfcAdapter.h>

#define PN532_SCK     13    // changed from pin 2  to  13
#define PN532_MISO    12    // changed from pin 5  to  12
#define PN532_MOSI    11    // changed from pin 3  to  11
#define PN532_SS      10    // changed from pin 4  to  10

PN532_SPI pn532spi(SPI, PN532_SS);
NfcAdapter nfc = NfcAdapter(pn532spi);
*/

// mp3 player variables
boolean plrStartPlaying = false;              // Is set to true in case an nfc tag is present with information on tracks to play
char plrCurrentFile[13] = "track001.mp3";     // which track is the player playing?
char plrCurrentFolder[9] = "system00";        // from which directory is the player playing?
char filename[23] = "/system00/track001.mp3"; // path and filename of the track to play
byte firstTrackToPlay = 1;                    // the track number as received from the tag
char playOrder = 'o';                         // o = ordered playback of all files in dir from 1-n / r = random playback of all files in dir / s = single playback regardless of other files in dir
char curTrackCharNumber[4] = "001";           // used to create the filename by converting 1 to 001 etc.
byte maxPlayCounter = 1;                      // usually we would play an album only once,
byte playCounter = 0;                         // hence we track the number of plays 



void setup(void) {
  Serial.begin(115200);
  Serial.println("NFC TAG READER: ");
  nfc.begin();
  Serial.println("\nScan your NFC tag");
  Serial.println("___________________________________________________\n");
}
boolean getNfcCardData();

void loop(void) {
  if (nfc.tagPresent()){
    Serial.println("NFC tag Found!\n");
    
    getNfcCardData();
    delay(5000);
  }
}

boolean getNfcCardData() {
  boolean usableContent = false;  // in case the tag has everything we need to play an album - in essence there must be a message with the directory - we return this as true
  
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
      
      if (i == 0) {                                       // we know that the directory to play is the first record in the message
        if (payloadLength == 12) {                        // length accords to directory
          usableContent = true;                           // if a directory is stored on the track, we may be able to play music
          p = strtok((char *)payload, " ");               // separate payload on space-delimiter as it's form is like this:  en bluemc99   or equivalent
          p = strtok(NULL, " ");                          // we only need the second entry and strtok() expects NULL for string on subsequent calls
          strcpy(plrCurrentFolder, p);                    // copy directory from tag into global player var
          if (DEBUG) {Serial.print(F("This is the directory we extracted: "));Serial.println(plrCurrentFolder);}
        }
      // repeat this for second and third entry
      } else if (i == 1) {                                // we know that the track to play is the second record in the message (if it exists at all)
        
        p = strtok((char *)payload, " ");
        p = strtok(NULL, " ");  
        strcpy(firstTrackToPlay, p);
        if (DEBUG) {Serial.print(F("This is the track we extracted: "));Serial.println(firstTrackToPlay);}
        
      } else if (i == 2) {                                // we know that the order in which to play is the third record in the message (if it exists at all)
        p = strtok((char *)payload, " ");
        p = strtok(NULL, " ");
        strcpy(playOrder, p);
        if (DEBUG) {Serial.print(F("This is the play order we extracted: "));Serial.println(playOrder);}
      }
    }
  }
  
  return (usableContent);
}
