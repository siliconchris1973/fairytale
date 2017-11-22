// This file is the central store for all configuration settings, such as,
// but not limited to, the different http and rest api endpoints
// it is sourced in by all application start scripts, such as cnf.js, player.js
// or nfcService.js.
// If you want to change ports and or other settings, such as API version,
// you can do it here and all parts of the fairytale app are informed.
var os = require('os');
var path = require('path');

// set server  Hostname for the main application
var appEndpoint = {
  AppName: 'App',
  Protocol: 'http',
  Host: os.hostname(),
  Port: Number(3000),
  Api: '/api/v1',
  Url: '/app',
  HealthUri: '/health',
  HelpUri: '/help',
  WelcomeUri: '/welcome',
  InfoUri: '/info',
  StatusUri: '/status',
  EndpointsUri: '/endpoints',
  Description: 'Main Application'
};

// http and rest api endpoint for the tag db interface
var tagDbServiceEndpoint = {
  AppName: 'TagDb Service',
  Protocol: 'http',
  Host: os.hostname(),
  Port: Number(3001),
  Api: '/api/v1',
  Url: '/tags',
  HealthUri: '/health',
  HelpUri: '/help',
  WelcomeUri: '/welcome',
  InfoUri: '/info',
  StatusUri: '/status',
  EndpointsUri: '/endpoints',
  Description: 'Tag Database'
};

// this is for the 4th node.js app, that controls the nfc reader
var nfcReaderEndpoint = {
  AppName: 'RFID Reader',
  Protocol: 'http',
  Host: os.hostname(),
  Port: Number(3003),
  Api: '/api/v1',
  Url: '/nfc',
  HealthUri: '/health',
  HelpUri: '/help',
  WelcomeUri: '/welcome',
  InfoUri: '/info',
  StatusUri: '/status',
  EndpointsUri: '/endpoints',
  Description: 'RFID/NFC Reader'
};

// this is for the node.js app, that does the actual file uploading
var fileServiceEndpoint = {
  AppName: 'File Service',
  Protocol: 'http',
  Host: os.hostname(),
  Port: Number(3004),
  Api: '/api/v1',
  Url: '/file',
  HealthUri: '/health',
  HelpUri: '/help',
  WelcomeUri: '/welcome',
  InfoUri: '/info',
  StatusUri: '/status',
  EndpointsUri: '/endpoints',
  Description: 'File Service'
};

// this is for the thrid node.js app, that does the actual audio playback
var playerEndpoint = {
  AppName: 'Player',
  Protocol: 'http',
  Host: os.hostname(),
  Port: Number(3002),
  Api: '/api/v1',
  Url: '/player',
  HealthUri: '/health',
  HelpUri: '/help',
  WelcomeUri: '/welcome',
  InfoUri: '/info',
  StatusUri: '/status',
  EndpointsUri: '/endpoints',
  Description: 'MP3 Player'
};

// http and rest api endpoint for the tag db interface
var ledServiceEndpoint = {
  AppName: 'LED Service',
  Protocol: 'http',
  Host: os.hostname(),
  Port: Number(3005),
  Api: '/api/v1',
  Url: '/led',
  HealthUri: '/health',
  HelpUri: '/help',
  WelcomeUri: '/welcome',
  InfoUri: '/info',
  StatusUri: '/status',
  EndpointsUri: '/endpoints',
  Description: 'Drive LEDs'
};

  var directories = {
    // the path to the file system where the nfc tags and Media Files are stored
    TagDB: path.resolve('../data/TagDB'),
    MediaDir: path.resolve('../data/Media'),
    SoundDir: path.resolve('./static/sounds'),
    UploadTmpDir: path.resolve('../data/Cover/tmp'),
    UploadIconDir: path.resolve('../data/Cover/icon'),
    UploadSmallDir: path.resolve('../data/Cover/small'),
    UploadNormalDir: path.resolve('../data/Cover/normal')
  };

  var leds = {
    'trippLED': {
      'BLUELED': Number(33),
      'REDLED': Number(37),
      'GREENLED': Number(35)
    },
    'blinkspeed': {
      'slow': Number(2),
      'normal': Number(0,75),
      'fast': Number(0,5)
    }
  };

  var debugging = {
    DEBUG: true,
    TRACE: true
  };

module.exports = {
  appEndpoint: appEndpoint,
  tagDbServiceEndpoint: tagDbServiceEndpoint,
  fileServiceEndpoint: fileServiceEndpoint,
  playerEndpoint: playerEndpoint,
  ledServiceEndpoint: ledServiceEndpoint,
  nfcReaderEndpoint: nfcReaderEndpoint,
  ledServiceEndpoint: ledServiceEndpoint,
  directories: directories,
  leds: leds,
  debugging: debugging
}
