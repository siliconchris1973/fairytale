// This file is the central store for the different http and rest api endpoints
// it is sourced in by all application start scripts, such as cnf.js, player.js
// or rfidService.js.
// If you want to change ports and or other settings, such as API version,
// you can do it here and all parts of the fairytale app are informed.
var os = require('os');
var path = require('path');

  // set server  Hostname for the main application
  var appEndpoint = {
    Protocol: 'http',
    Hostname: os.hostname(),
    Port: Number(3000),
    Api: '/api/v1',
    Url: '/tags'
  };

  // http and rest api endpoint for the tag db interface
  var tagDbEndpoint = {
    Protocol: 'http',
    Hostname: os.hostname(),
    Port: Number(3000),
    Api: '/api/v1',
    Url: '/tags'
  };

  // this is for the second node.js app, that does the actual file uploading
  var fileServiceEndpoint = {
    Protocol: 'http',
    Hostname: os.hostname(),
    Port: Number(3001),
    Api: '/api/v1',
    Url: '/file'
  };

  // this is for the thrid node.js app, that does the actual audio playback
  var playerEndpoint = {
    Protocol: 'http',
    Hostname: os.hostname(),
    Port: Number(3002),
    Api: '/api/v1',
    Url: '/player'
  };

  // this is for the 4th node.js app, that controls the rfid reader
  var rfidReaderEndpoint = {
    Protocol: 'http',
    Hostname: os.hostname(),
    Port: Number(3003),
    Api: '/api/v1',
    Url: '/rfid'
  };

  var directories = {
    // the path to the file system where the rfid tags and Media Files are stored
    rfidTagDir: path.resolve('../../data/TagDB'),
    MediaDir: path.resolve('../../data/Media'),
    SoundDir: path.resolve('./static/sounds')
  };

  var debugging = {
    DEBUG: true,
    TRACE: true
  };

module.exports = {
  appEndpoint: appEndpoint,
  tagDbEndpoint: tagDbEndpoint,
  fileServiceEndpoint: fileServiceEndpoint,
  playerEndpoint: playerEndpoint,
  rfidReaderEndpoint: rfidReaderEndpoint,
  directories: directories,
  debugging: debugging
}
