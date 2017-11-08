var express = require('express'),
  plr = express(),
  port = process.env.PORT || 3002,
  stylus = require('stylus'),
  nib = require('nib');

// get the hostname of the server we run on
var os = require('os');
// get files and folder locations correctly
var path = require('path');

// how do we handle requests and parse the request body
var bodyParser = require("body-parser");
plr.use(bodyParser.json());
plr.use(bodyParser.urlencoded({ extended: true }));


// these set static exposures for media files and pictures and such
plr.use(express.static(path.resolve('./static')));
plr.use(express.static(path.resolve('./modules')));
plr.use(express.static(path.resolve('./views')));
plr.use(express.static(path.resolve('./data')));

// these settings are made available via app.get('variable name')
// from within all subsequent scripts
// a rather ugly global DEBUG switch
plr.set('DEBUG', true);
// plus another also very ugly TRACE switch
plr.set('TRACE', true);

// access to static content, the media and tag files
plr.set('/img', express.static(path.resolve('./static/img')));
plr.set('/sounds', express.static(path.resolve('./static/sounds')));
plr.set('/Media', express.static(path.resolve('../data/Media')));
plr.set('/TagDB', express.static(path.resolve('../data/TagDB')));

// the path to the file system where the rfid tags and Media Files are stored
plr.set('rfidTagDir', path.resolve('../data/TagDB'));
plr.set('MediaDir', path.resolve('../data/Media'));
plr.set('SoundDir', path.resolve('./static/sounds'));


// settings for the template engine pug
plr.set('/views', express.static('/views'));
plr.set('view engine', 'pug');


// this is for the third node.js app, that does the actual audio playback
plr.set('playerProto', 'http');
plr.set('playerAddr', os.hostname());
plr.set('playerPort', Number(3002));
plr.set('playerApi', '/api/v1');
plr.set('playerUrl', '/player');


// set the routes for different part of the application
var playerRoutes = require('./routes/routes_player.js')(plr);
// instantiate the mp3 player and play the startup sound
var thePlayer = require('./modules/thePlayer.js');


var playerProto = plr.get('playerProto');
var playerAddr = plr.get('playerAddr');
var playerPort = plr.get('playerPort');
var playerApi = plr.get('playerApi');
var playerUrl = plr.get('playerUrl');
var SoundDir = plr.get('SoundDir');
var rfidTagDir = plr.get('rfidTagDir');
var MediaDir = plr.get('MediaDir');

var DEBUG = plr.get('DEBUG');
var TRACE = plr.get('TRACE');

if (TRACE) {
  console.log('environment: ');
  console.log('   playerProto = ' + playerProto);
  console.log('   playerAddr = ' + playerAddr);
  console.log('   playerPort = ' + playerPort);
  console.log('   playerApi = ' + playerApi);
  console.log('   playerUrl = ' + playerUrl);
  console.log('   SoundDir = ' + SoundDir);
  console.log('   rfidTagDir = ' + rfidTagDir);
  console.log('   MediaDir = ' + MediaDir);
  console.log('   DEBUG = ' + DEBUG);
  console.log('   TRACE = ' + TRACE + ' (otherwise you would not see this)');
}

var f = SoundDir + '/' + 'hello.mp3';
if (DEBUG) console.log('instantiating new player with welcome sound ' + f);
var myPlr = new thePlayer(f, 0);
myPlr.playTrack();

var player = plr.listen(playerPort, function () {
    console.log("Player listening on %s://%s:%s API endpoint is %s%s...", playerProto, playerAddr, playerPort, playerApi, playerUrl);
});
