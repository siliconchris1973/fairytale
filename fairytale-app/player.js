var express = require('express'),
  plr = express(),
  port = process.env.PORT || 3002,
  stylus = require('stylus'),
  nib = require('nib');

var os = require('os');
var path = require('path');

// how do we handle requests and parse the request body
var bodyParser = require("body-parser");
plr.use(bodyParser.json());
plr.use(bodyParser.urlencoded({ extended: true }));

// settings for the template engine pug
plr.set('/views', express.static('/views'));
plr.set('view engine', 'pug');

// these set static exposures for media files and pictures and such
plr.use(express.static(path.resolve('./static')));
plr.use(express.static(path.resolve('./modules')));
plr.use(express.static(path.resolve('./views')));
plr.use(express.static(path.resolve('./data')));
// access to static content, the media and tag files
plr.set('/img', express.static(path.resolve('./static/img')));
plr.set('/sounds', express.static(path.resolve('./static/sounds')));
plr.set('/Media', express.static(path.resolve('../data/Media')));
plr.set('/TagDB', express.static(path.resolve('../data/TagDB')));


// get the global configuration
var config = require('./modules/configuration.js');


// these settings are made available via app.get('variable name')
// from within all subsequent scripts
// a rather ugly global DEBUG switch
plr.set('DEBUG', config.debugging.DEBUG);
// plus another also very ugly TRACE switch
plr.set('TRACE', config.debugging.TRACE);

// the path to the file system where the rfid tags and Media Files are stored
plr.set('rfidTagDir', config.directories.rfidTagDir);
plr.set('MediaDir', config.directories.MediaDir);
plr.set('SoundDir', config.directories.SoundDir);

// http and rest api endpoint for the player
plr.set('playerProto', config.playerEndpoint.Protocol);
plr.set('playerAddr', config.playerEndpoint.Hostname);
plr.set('playerPort', Number(config.playerEndpoint.Port));
plr.set('playerApi', config.playerEndpoint.Api);
plr.set('playerUrl', config.playerEndpoint.Url);

// http and rest api endpoint for the tag db interface
plr.set('tagDbServiceProto', config.tagDbEndpoint.Protocol);
plr.set('tagDbServiceAddr', config.tagDbEndpoint.Hostname);
plr.set('tagDbServicePort', Number(config.tagDbEndpoint.Port));
plr.set('tagDbServiceApi', config.tagDbEndpoint.Api);
plr.set('tagDbServiceUrl', config.tagDbEndpoint.Url);


// set the routes and the controller for the mp3 player
var playerRoutes = require('./routes/routes_player.js')(plr);
var thePlayer = require('./controller/playerController.js');

// get the http endpoint information for the player app - this is only
// needed here, so we can output them on the console.
var playerProto = plr.get('playerProto');
var playerAddr = plr.get('playerAddr');
var playerPort = plr.get('playerPort');
var playerApi = plr.get('playerApi');
var playerUrl = plr.get('playerUrl');

var player = plr.listen(playerPort, function () {
    thePlayer.init(plr);
    console.log("Player listening on %s://%s:%s API endpoint is %s%s...", playerProto, playerAddr, playerPort, playerApi, playerUrl);
});
