
//
// setup NFC Adapter
//
// USE SPI

#include <PN532_SPI.h>
#include <PN532.h>
#include <NfcAdapter.h>

#define PN532_SCK (13) //changed from pin 2
#define PN532_MISO (12) //changed from pin 5
#define PN532_MOSI (11) //changed from pin 3
#define PN532_SS (10) //changed from 4

PN532_SPI pn532spi(SPI, PN532_SS);
NfcAdapter nfc = NfcAdapter(pn532spi);

String directory = " bibtin88";
String track = " 1";
//String position = "0";

char plrCurrentFile[13]     = "track001.mp3";           // which track is the player playing?
char plrCurrentFolder[9]    = "system00";               // from which directory is the player playing?
char filename[23]           = "/system00/track001.mp3"; // path and filename of the track to play
byte firstTrackToPlay       = 1;                        // the track number as received from the tag
char curTrackCharNumber[4]  = "001";                    // used to create the filename by converting 1 to 001 etc.

boolean loopMessage = true;

boolean writeTagData(String, String);
//void printDirectory(File, byte);              // print out the content of specified directory on serial console
//byte countFiles(File);                        // return the number of files in a directory passed as a File descriptor
boolean getNfcCardData(void);


void setup() {
    Serial.begin(115200);
    nfc.begin();
    delay(1000);
    Serial.println("NFC Tag Writer ready"); // Serial Monitor Message
}


void loop() {
  if (loopMessage) {
    Serial.print("\nPlace an NFC Tag that you want to define for use with the audiobook!");Serial.println(directory); // Command for the Serial Monitor
    loopMessage = false;
  }
  if (nfc.tagPresent()) {
    boolean success = writeTagData(directory, track);
    if (success) {
        Serial.println("Good Job, you may now use this NFC tag with fairytale!"); // if it works you will see this message 
        getNfcCardData();
    } else {
        Serial.println("Write failed"); // If the the rewrite failed you will see this message
    }
    delay(1000);
    // Wait a bit before trying again
    Serial.println("\n\nYou may now turn off the Arduino!");
    Serial.flush();
    while (!Serial.available());
    while (Serial.available()) {
      Serial.read();
      loopMessage = true;
    }
    Serial.flush();
  }
  
}



boolean writeTagData(String directory, String track) {
  NdefMessage message = NdefMessage();
  message.addTextRecord(directory);     // In which directory are the files
  message.addTextRecord(track);         // Which Track did we play last
  boolean success = nfc.write(message);
  return(success);
}

boolean getNfcCardData(void) {
  boolean usableContent = true;  // in case the tag has everything we need to play an album - in essence there must be a message with the directory - we return this as true
  
  NfcTag tag = nfc.read();
  Serial.print(F("Tag Type: ")); Serial.println(tag.getTagType()); Serial.print(F("UID: ")); Serial.println(tag.getUidString()); 

  if (tag.hasNdefMessage()) {
    NdefMessage message = tag.getNdefMessage();

    // If you have more than 1 Message then it will cycle through them
    for (byte i = 0; i < message.getRecordCount(); i++) {
      NdefRecord record = message.getRecord(i);

      uint8_t payloadLength = record.getPayloadLength();
      byte payload[payloadLength];
      record.getPayload(payload);

      String payloadAsString = ""; // Processes the message as a string vs as a HEX value
      for (byte c = 0; c < payloadLength; c++) {
        payloadAsString += (char)payload[c];
      }
      
      Serial.print(F("content element ")); Serial.print(i); Serial.print(F(": ")); Serial.println(payloadAsString);
  
    }
  } else { // does the card have NDEF messages?
    Serial.println(F("THIS CARD DOES NOT HAVE MESSAGES AT ALL - NOT USABLE FOR THE MP3 PLAYER"));
    usableContent = false;
  }
  
  return (usableContent);
}
