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
// Seedmaster Library with SPI
#include <PN532_SPI.h>
#include <PN532.h>

#define PN532_SCK     13    // changed from pin 2  to  13
#define PN532_MISO    12    // changed from pin 5  to  12
#define PN532_MOSI    11    // changed from pin 3  to  11
#define PN532_SS      10    // changed from pin 4  to  10
PN532_SPI pn532spi(SPI, PN532_SS);
PN532 nfc(pn532spi);


// mp3 player variables
char plrCurrentFolder[9] = "klenbaer"; // fndstort fndszelt jkwild13 kokosnil lieselot                            // from which directory is the player playing?
byte firstTrackToPlay    = 1;                        // the track number as received from the tag


// file system and SD structure variables
char trackDbDir[10]      = "/trackdb0";              // where do we store the files for each album 
char trackDbFile[23]     = "/trackdb0/albumnfc.txt"; // path to the file that holds the connection between an NFC tag UID and the corresponding directory / file name
char tDirFile[23];                                   // a char array to hold the path to the file with track and directory infos (name is shared with directory name plus .txt


// NFC Tag data
byte uid[]               = { 0, 0, 0, 0, 0, 0, 0 };  // Buffer to store the returned UID
char charUid[22];                                    // char representation of the UID
byte uidLength;                                      // Length of the UID (4 or 7 bytes depending on ISO14443A card type)
char trackDbEntry[35];                               // will hold a nfc <-> album info connection in the form of [NFC Tag UID]:[album] e.g.: 43322634231761291:larsrent


boolean createAlbumDbEntry(void);                    // create / update two files on SD to connect NFC Tag UID with a directory name and a track to start playback with
void printTrackDb(void);
void printAlbumData(void);                            // print global vars with data from nfc tag and return true in case tag contains data or false if not
void printDirectory(File, byte);
void deleteFilesFromDir(File);

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

