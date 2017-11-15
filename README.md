# fairytale
## Introduction
Fairytale is a node.js server application designed to play mp3 files (such as
  but of course not limited to audiobooks). You can either control it using
  a rather ugly HTML interface or, which is the intended usage, by RFID or NFC tags.

## Background
To read the story that inspired me to do this, visit: https://gist.github.com/wkjagt/814b3f62ea03c7b1a765

## Installation
To get going issue:

     git clone https://github.com/siliconchris1973/fairytale

     cd fairytale
     cd fairytale-app
     mkdir data/Media
     mkdir data/TagDB
     mkdir data/Cover
     mkdir data/Cover/icon
     mkdir data/Cover/small
     mkdir data/Cover/normal
     npm install

## Dependencies
fairytale depends on
- MPlayer to play the audio files
- libnfc to read the RFID / NFC tags
- node-nfc-daemon to expose libnfc as a websocket

### Install MPlayer
#### Debian (and derivates like Raspbian)
     sudo apt-get install mplayer

#### Mac OS X
     brew install mplayer

### Install libnfc
#### Raspbian
You can either install the libnfc from the distro or compile it from source.
To install the nfc library bundled with Raspbian (Jessie but probably stretch also):

     sudo apt-get libnfc

To compile it from the git source:

     cd ~
     wget http://dl.bintray.com/nfc-tools/sources/libnfc-1.7.1.tar.bz2
     tar -xf libnfc-1.7.1.tar.bz2  
     cd libnfc-1.7.1
     ./configure --prefix=/usr --sysconfdir=/etc
     make
     sudo make install

Create a configuration file:

     cd /etc
     sudo mkdir nfc
     sudo vi /etc/nfc/libnfc.conf

Content of the configuration file (for SPI connection on a Raspberry Pi) is like follows:

     # Allow device auto-detection (default: true)
     # Note: if this auto-detection is disabled, user has to set manually a device
     # configuration using file or environment variable
     allow_autoscan = true

     # Allow intrusive auto-detection (default: false)
     # Warning: intrusive auto-detection can seriously disturb other devices
     # This option is not recommended, user should prefer to add manually his device.
     allow_intrusive_scan = false

     # Set log level (default: error)
     # Valid log levels are (in order of verbosity): 0 (none), 1 (error), 2 (info), 3 (debug)
     # Note: if you compiled with --enable-debug option, the default log level is "debug"
     log_level = 1

     # Manually set default device (no default)
     # To set a default device, you must set both name and connstring for your device
     # Note: if autoscan is enabled, default device will be the first device available in device list.
     device.name = "_PN532_SPI"
     device.connstring = "pn532_spi:/dev/spidev0.0:500000"
     #device.name = "_PN532_I2c"
     #device.connstring = "pn532_i2c:/dev/i2c-1"

#### MacOS X
If you happen to be doing all this on OS X you _may_ need to accept the developers
license for Xcode. Agree to the license terms by executing (in a shell, of
course):

     sudo xcodebuild -license

For libnfc to compile on Mac OS X you will need doxygen, which I recommend you install via brew

     brew install doxygen

Now cd to a convenient directory where you want libnfc source to reside and hack in:

     git clone https://github.com/nfc-tools/libnfc.git
     cd libnfc
     ./configure --enable-doc
     make
     sudo make install

This will install libnfc in /usr/local directory, which I usually do not find to be convenient on OS X, as I can't easily remove it if wanted. Usually I'd prefer to install it in /opt/libnfc, but I couldn't find a way to get node-nfc-daemon to compile on my Mac with libnfc installed below opt, so I put it in /usr/local

Further information on libnfc can be found at
 http://nfc-tools.org/index.php?title=Libnfc

### Install node-nfc-daemon
For information on node-nfc-daemon setEncoding
  https://www.npmjs.com/package/nfc-daemon

#### Raspbian / Mac OS X
     yarn global add nfc-daemon


## Running
fairytale is composed of 5 different services:
1. app.js - main server application
2. player.js - the mp3 player
3. tagDbService.js - an interface to the stored tags with meta data on the mp3 files
4. node-nfc-daemon - the nfc reader service
5. fileService.js - upload files

### Mandatory components
#### app.js
This is the main component. It listens on port 3000 and exposes it's endpoints to /api/v1/... for json and html clients.

To start up the main application execute:

     node app.js

#### player.js
The MP3 Player application. It listens on port 3001 and exposes it's endpoint to /api/v1/player for json and html clients.

To start the mp3 player execute:

     node player.js

#### tagDbService.js
An interface to stored json files that contain the necessary meta data on the nfc tags.
Within each json file a nfc tag and the corresponding mp3 files are described.

To start the TagDB service execute:

     node tagDbService.js

### Optional components
#### rfidService.js
The RFID and NFC tag reader. It listens on port 3003 and exposes it's endpoint to /api/v1/rfid for json and html clients.

To start the RFID and NFC Reader execute:

     node rfidService.js

#### fileService.js
The file uploader only exposes a html formm at the moment and is available on port 3002 at /api/v1/file
To start the optional fileService (for uploading files) execute:

     node fileService.js

## Create Content to play
For the play to actually play a file, two things need to be done:
1. Create a JSON File with information on the mp3 file you want to hear, when you put the tag on the reader
2. Copy the mp3 files in a specific directory.

A typical json file looks like follows:

75EDB4.json:

       {
        "tagdata": {
          "TagChecksum": "0x23",
          "TagId": "75EDB4",
          "TagPreTag": "0xf00",
          "TagRawData": "0F0075EDB423"
        },
        "MediaTitle": "Frederick",
        "MediaType": "Hoerspiel",
        "MediaGenre": "Kindergeschichte",
        "MediaDescription": "Ein Hörspiel mit Musik zu Frederick der kleinen Maus",
        "TrackCount": [
          {"disk": "1", "tracks": "1"}
        ],
        "DiskCount": "1",
        "MediaFiles": [{
          "disk": "1",
          "part": "1",
          "id": "75EDB4:d1:p1",
          "name": "Frederick.mp3",
          "path": "Media/Disk_1/Frederick.mp3",
          "lastposition": "-1",
          "playcount": "0",
          "size": "24M"
        }],
        "MediaPicture": [{
          "pic": "1",
          "name": "Frederick.jpg",
          "path": "Cover/normal/Frederick.jpg"
        }]
       }

As you can see, you can have multiple mp3 files associated with a tag and the player
will play all files in the given order - you can also split files in disks.

To make registering a new tag with it's files easier, I will include a page to aid in the process.
Currently, when you have a new tag and want to associate it with mp3-files you will need
to do the following:

- copy/create a json file in the data/TagDB directory. The name of the file needs to match the UUID
- make a new directory with the UUID of the nfc tag bewlo data/Media - all upper case
- copy all mp3-files in the sub directories you referenced within the json files in the path section.
