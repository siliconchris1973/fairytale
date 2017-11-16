// This file is the central store for the different http and rest api endpoints
// it is sourced in by all application start scripts, such as cnf.js, player.js
// or rfidService.js.
// If you want to change ports and or other settings, such as API version,
// you can do it here and all parts of the fairytale app are informed.
var os = require('os');
var path = require('path');

  // set server  Hostname for the main application
  var appEndpoint = {
    AppName: 'App',
    Protocol: 'http',
    Hostname: os.hostname(),
    Port: Number(3000),
    Api: '/api/v1',
    Url: '/',
    HealthUri: '/health',
    HelpUri: '/help',
    Description: 'Main Application - the glue'
  };

  // http and rest api endpoint for the tag db interface
  var tagDbServiceEndpoint = {
    AppName: 'TagDb Service',
    Protocol: 'http',
    Hostname: os.hostname(),
    Port: Number(3001),
    Api: '/api/v1',
    Url: '/tags',
    HealthUri: '/health',
    HelpUri: '/help',
    Description: 'Tag Database Service'
  };

  // this is for the thrid node.js app, that does the actual audio playback
  var playerEndpoint = {
    AppName: 'Player',
    Protocol: 'http',
    Hostname: os.hostname(),
    Port: Number(3002),
    Api: '/api/v1',
    Url: '/player',
    HealthUri: '/health',
    HelpUri: '/help',
    Description: 'The MP3 Player'
  };

  // this is for the 4th node.js app, that controls the rfid reader
  var rfidReaderEndpoint = {
    AppName: 'RFID Reader',
    Protocol: 'http',
    Hostname: os.hostname(),
    Port: Number(3003),
    Api: '/api/v1',
    Url: '/rfid',
    HealthUri: '/health',
    HelpUri: '/help',
    Description: 'The RFID/NFC reader service'
  };

  // this is for the node.js app, that does the actual file uploading
  var fileServiceEndpoint = {
    AppName: 'FileService',
    Protocol: 'http',
    Hostname: os.hostname(),
    Port: Number(3004),
    Api: '/api/v1',
    Url: '/file',
    HealthUri: '/health',
    HelpUri: '/help',
    Description: 'File Uploaad Service'
  };

  var directories = {
    // the path to the file system where the rfid tags and Media Files are stored
    TagDB: path.resolve('../data/TagDB'),
    MediaDir: path.resolve('../data/Media'),
    SoundDir: path.resolve('./static/sounds'),
    UploadTmpDir: path.resolve('../data/Cover/tmp'),
    UploadIconDir: path.resolve('../data/Cover/icon'),
    UploadSmallDir: path.resolve('../data/Cover/small'),
    UploadNormalDir: path.resolve('../data/Cover/normal')
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
  rfidReaderEndpoint: rfidReaderEndpoint,
  directories: directories,
  debugging: debugging
}
