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
fairytale depends on libnfc to read the RFID / NFC tags and on MPlayer to play the audio files.

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

### MacOS X
If you happen to be doing all this on OS X you _may_ need to accept the developers
license for Xcode. Agree to the license terms by executing (in a shell, of
course):

     sudo xcodebuild -license


## Running
fairytale is composed of 4 different components:
1. app.js - main server application
2. player.js - the mp3 player
3. rfidService.js - the rfid reader service
4. fileService.js - upload files

### Mandatory components
#### app.js
This is the main component. It listens on port 3000 and exposes it's endpoints to /api/v1/... for json and html clients.

To start up the main application execute:

     node app.js

#### player.js
The MP3 Player application. It listens on port 3001 and exposes it's endpoint to /api/v1/player for json and html clients.

To start the mp3 player execute:

     node player.js

### Optional components
#### rfidService.js
The RFID and NFC tag reader. It listens on port 3003 and exposes it's endpoint to /api/v1/rfid for json and html clients.

To start the RFID and NFC Reader execute:

     node rfidService.js

#### fileService.js
The file uploader only exposes a html formm at the moment and is available on port 3002 at /api/v1/file
To start the optional fileService (for uploading files) execute:

     node fileService.js
