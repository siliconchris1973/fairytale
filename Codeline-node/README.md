h1. fairytale
h2. Introduction
Fairytale is a node.js server application designed to play mp3 files (such as
  but of course not limited to audiobooks). You can either control it using
  a rather ugly HTML interface or, which is the intended usage, by RFID or NFC tags.

h2. Installation
To get going issue:

  git clone https://github.com/siliconchris1973/fairytale

  cd fairytale
  cd Codeline-node
  mkdir data/Media
  npm install

h3. MacOS X
If you happen to be doing this on OS X you _may_ need to accept the developers
license for Xcode. Agree to the license terms by executing (in a shell, of
course):

  sudo xcodebuild -license


h2. Running
h3. Mandatory components
To start up the main application execute:

  node app.js

To start teh mp3 player execute:

  node player.js

h3. Optional components
To start the optional RFID and NFC Reader execute:

  node rfidService.js

To start the optional fileService (for uploading files) execute:

  node rfidService.js
