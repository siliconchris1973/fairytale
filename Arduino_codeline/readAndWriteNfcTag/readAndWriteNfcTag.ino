// BOF preprocessor bug prevent - insert me on top of your arduino-code
#if 1
__asm volatile ("nop");
#endif
/*
   Fairytale Main program

   This programm will read an nfc tag. It will check for a directory name and optional a filename
   and start playing this on the music maker shield.

   Restrictions:
   1. All filenames must be in the format  trackXXX.mp3  - where XXX is a numbering from 001 to 127
   2. You can have a maximum of 127 files per directory - as I use a char to count the files to preserve memory
   3. All directory names must be exactly 8 chars long - use any combination of a-z and 0-9 chars for the name
   4. if a file is missing you will get a glitch in the sound while an error flashlight is lit up
*/

// make sure to change this to false before uploading in production as it turns on lots and lots of serial messages
boolean DEBUG = true;


// include the string header so we can use strcpy()
#include <string.h>

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

/*
  // OR I2C
  #include <Wire.h>
  #include <PN532_I2C.h>
  #include <PN532.h>   // The following files are included in the libraries Installed
  #include <NfcAdapter.h>
  PN532_I2C pn532_i2c(Wire);
  NfcAdapter nfc = NfcAdapter(pn532_i2c);  // Indicates the Shield you are using
*/

//        VV     VV      Y       RRRRRR
//        VV     VV     AAA      RR   RR
//         VV   VV     AA AA     RR   RR
//          VV VV     AAAAAAA    RRRRRR
//            V      AA      AA  RR   RR
//
// LIGHT EFFECTS
const byte ledPin = 5;                        // the pin to which the operation led is connected to
const byte warnPin = 9;                       // the pin to which the warning led is connected to
const byte errorPin = 8;                      // the pin to which the error led is connected to
boolean lightOff = false;                     // is set to true via a button, or after a certain amount of time - if true the operation fader light will be turned off

// uptime counters
unsigned long startUpTime = 0;
const unsigned long maxUpTime = 1800000L;     // how long will the system stay on while nothing is playing - default 1800000 = 30 Minutes


// booleans to chose whether or not to show continuing warning messages in the loop
boolean loopOverCard = true;      // make sure we only loop over the card reading writing intentionally 

char cardId[] = { 00, 00, 00, 00, 00, 00, 00 };

// mp3 player variables
boolean plrStartPlaying = false;              // Is set to true in case an nfc tag is present with information on tracks to play
char plrCurrentFile[13] = "track001.mp3";     // which track is the player playing?
char plrCurrentFolder[9] = "system00";        // from which directory is the player playing?
char filename[23] = "/system00/track001.mp3"; // path and filename of the track to play
byte firstTrackToPlay = 1;                    // the track number as received from the tag
char playOrder = 'o';                         // o = ordered playback of all files in dir from 1-n / r = random playback of all files in dir / s = single playback regardless of other files in dir
char curTrackCharNumber[4] = "001";           // used to create the filename by converting 1 to 001 etc.


// this is used for the user input dialog
const char HEADER = 'H';    // character to identify the start of a message
short LF = 10; 

//
//        PPPPP     RRRRR     OOOOOO   TTTTTTTT   OOOOOO   TTTTTTTT  YY    YY   PPPPP    EEEEEE   SSSSS
//       PP    PP  RR    RR  OO    OO     TT     OO    OO     TT      YY  YY   PP    PP  EE      SS
//       PP    PP  RR    RR  OO    OO     TT     OO    OO     TT       YYYY    PP    PP  EEEE     SSSSS
//       PPPPPP    RRRRRR    OO    OO     TT     OO    OO     TT        YY     PPPPPPP   EE          SS
//       PP        RR    RR   OOOOOO      TT      OOOOOO      TT        YY     PP        EEEEEE  SSSSS
//
// these are the prototypes for the nfc card reader
boolean getNfcCardData(void);                 // fill global vars with data from nfc tag and return true in case tag contains data or false if not
boolean writeNfcCardData(void);               // write the currently played track to the nfc tag, so we can start from there next time and return true for success and false in case of an error



// these are the prototypes for the led info
void infoLed(void);                           // smooth dimming based on millis() during playback
void errorLed(void);                          // rapid flashing of error led
void warnLed(void);                           // up and down dimming of the warning led

//
//       SSSSSS  EEEEEE  TTTTTTTT  UU   UU  PPPPPP
//      SS       EE         TT     UU   UU  PP   PP
//       SSSSS   EEEE       TT     UU   UU  PP   PP
//           SS  EE         TT     UU   UU  PPPPPP
//      SSSSSS   EEEEEE     TT      UUUUU   PP
//
void setup() {
  Serial.begin(115200);
  
  // and the leds as output
  pinMode(ledPin, OUTPUT);
  pinMode(warnPin, OUTPUT);
  pinMode(errorPin, OUTPUT);



  // now as the last thing, start the nfc reader
  // if (DEBUG) { Serial.print(F("initializing NFC TAG reader ... ")); }
  nfc.begin();
  Serial.print(F("NFC TAG READER AND WRITER ... ")); 
  delay(1000);
  Serial.println("ready"); 
  // check our current time, so we know when to stop
  startUpTime = millis();

  //if (DEBUG) { Serial.print(F("fairytale up and running at "));Serial.println(startUpTime); printDirectory(SD.open("/"), 0); }
}


//
//       LL       OOOOOO    OOOOOO   PPPPPPP
//       LL      OO    OO  OO    OO  PP    PP
//       LL      OO    OO  OO    OO  PP    PP
//       LL      OO    OO  OO    OO  PPPPPP
//       LLLLLL   OOOOOO    OOOOOO   PP
//
void loop() {
  // NFC Tag reader functions
  // now we only do this, when an nfc tag is present
  if (nfc.tagPresent() && loopOverCard) {
    loopOverCard = false;
    
    if (DEBUG) { Serial.println("NFC tag Found!"); }
    
    Serial.println(F("let's see what the tag contains"));
    getNfcCardData();
    Serial.println(F("to write this tag with new data enter    w"));
    
      
    // provide information on played track to serial console
    //String getCommand = Serial.readStringUntil(LF);
    String getCommand = "x";
    if (getCommand == 'w') {
      Serial.println(F("let's write some data to the tag")); 
      getTagDataFromUser();
    } else if (getCommand == 'l') {
      loopOverCard = true;
    } else {
      Serial.println(F("let's see what the tag contains"));
      getNfcCardData();
    }
  }
}

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
  boolean usableContent = true;  // in case the tag has everything we need to play an album - in essence there must be a message with the directory - we return this as true
  //strcpy(plrCurrentFolder, "infomsg0");   // comment this out, once the NFC tag reader works
  //firstTrackToPlay = 1;                   // this too has to be commented out in case the nfc tag reader works
  
  NfcTag tag = nfc.read();
  if (DEBUG) { Serial.print(F("Tag Type: ")); Serial.println(tag.getTagType()); Serial.print(F("UID: ")); Serial.println(tag.getUidString()); }

  if (tag.hasNdefMessage()) {
    NdefMessage message = tag.getNdefMessage();

    // If you have more than 1 Message then it will cycle through them
    for (byte i = 0; i < message.getRecordCount(); i++) {
      NdefRecord record = message.getRecord(i);

      uint8_t payloadLength = record.getPayloadLength();
      byte payload[payloadLength];
      record.getPayload(payload);
      char* p;  // this is where we store the result of strtok()

      // 
      if (i == 0) {
        if (payloadLength == 12) { // length accords to directory
          usableContent = true;
          p = strtok(payload, " ");
          p = strtok(NULL, " ");  //expects NULL for string on subsequent calls
          strcpy(plrCurrentFolder, p);
          if (DEBUG) {Serial.print(F("This is the directory we extracted: "));Serial.println(plrCurrentFolder);}
        }
      } else if (i == 1) { // track should be here
        p = strtok(payload, " ");
        p = strtok(NULL, " ");  //expects NULL for string on subsequent calls
        strcpy(firstTrackToPlay, p);
        if (DEBUG) {Serial.print(F("This is the track we extracted: "));Serial.println(firstTrackToPlay);}
        
      } else if (i == 2) { // order of playback
        p = strtok(payload, " ");
        p = strtok(NULL, " ");  //expects NULL for string on subsequent calls
        strcpy(playOrder, p);
        if (DEBUG) {Serial.print(F("This is the play order we extracted: "));Serial.println(playOrder);}
      }
    }
  } else { // does the card have NDEF messages?
    if (DEBUG) { Serial.println(F("THIS CARD DOES NOT HAVE MESSAGES AT ALL - NOT USABLE FOR THE MP3 PLAYER")); }
    usableContent = false;
  }
  
  return (usableContent);
}


// write the tag data
boolean writeNfcCardData(void) {
  boolean success = false;  // in case we have an error we set this to false
  
  if (nfc.tagPresent()) {
    if (nfc.clean()) {      // reset tag
      NfcTag tag = nfc.read();
      if (tag.hasNdefMessage()) {
        NdefMessage message = NdefMessage();
        //message.addTextRecord("A: ", plrCurrentAlbum);        // Which album is associated with the tag
        message.addTextRecord("D: ", plrCurrentFolder);         // In which directory are the files
        message.addTextRecord("T: ", String(firstTrackToPlay)); // Which Track did we play last
        //message.addTextRecord("P: ", position);               // how many seconds into the track did we listen to last time
  
        success = nfc.write(message);
      } 
    }
  } 
  return (success);
}

boolean getTagDataFromUser(void) {
  char directory[9] = {'\0'};
  char track[1] = {'\0'};
  Serial.print("enter data for this tag, or remove it to leave it unchanged\n");
  //int val = Serial.parseInt(); //read int or parseFloat for ..float...
  Serial.setTimeout(60000);

  
  Serial.println(F("Provide Directory for files (8 chars) "));
  
  if (Serial.available()>=8){
    for (byte i=0; i<8; i++){
      directory[i] = Serial.read();
    }
  }
  Serial.print(F("I got this for the directory"));Serial.println(directory);
  strcpy(plrCurrentFolder, directory);
  Serial.println("Provide Last Track played or 1 for start of album ");
  if (Serial.available()>=1){
    for (byte i=0; i<1; i++){
      track[i] = Serial.read();
    }
  }
  Serial.print(F("I got this for the track"));Serial.println(track);
  strcpy(firstTrackToPlay, track);
  /*
  Serial.print("enter position within last played file in seconds ");
  position = Serial.readString();
  */
  
  //album = "A: " + album;
  strcat(directory, 'D');
  strcat(directory, plrCurrentFolder);
  strcat(track, 'T');
  strcat(track, firstTrackToPlay);
  //position = "P: " + position;
  
  Serial.print("About to write the following data to the tag \n");
  Serial.print("Directory: ");Serial.println(directory);
  Serial.print("Last Track: ");Serial.println(track);
  Serial.print("Hit 1 to write data or any other key to exit: ");
  char input = Serial.read();

  if (input == '1') {
    return(writeNfcCardData());
  }
}

void infoLed(void) {
  if (!lightOff) analogWrite(ledPin, 128 + 127 * cos(2 * PI / 20000 * millis()));
}
void errorLed(void) {
  for (byte i = 0; i < 5; i++) {
    digitalWrite(errorPin, HIGH); delay(5); digitalWrite(errorPin, LOW); delay(5);
  }
}
void warnLed(void) {
  for (byte i = 0; i < 255; i++) { analogWrite(warnPin, i); delay(10); }
  for (byte i = 255; i == 0; i--) { analogWrite(warnPin, i); delay(10); }
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
