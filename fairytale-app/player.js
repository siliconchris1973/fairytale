var express = require('express'),
  app = express(),
  port = process.env.PORT || 3002,
  stylus = require('stylus'),
  nib = require('nib');

// get the hostname of the server we run on
var os = require('os');
var path = require('path');

// how do we handle requests and parse the request body
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// settings for the template engine pug
app.set('/views', express.static('/views'));
app.set('view engine', 'pug');

// these set static exposures for media files and pictures and such
app.use(express.static(path.resolve('./static')));
app.use(express.static(path.resolve('./modules')));
app.use(express.static(path.resolve('./views')));
app.use(express.static(path.resolve('./data')));
// access to static content, the media and tag files
app.set('/img', express.static(path.resolve('./static/img')));
app.set('/sounds', express.static(path.resolve('./static/sounds')));
app.set('/Media', express.static(path.resolve('../data/Media')));
app.set('/TagDB', express.static(path.resolve('../data/TagDB')));


// get the global configuration
var config = require('./modules/configuration.js');

// these settings are made available via app.get('variable name')
// from within all subsequent scripts
// a rather ugly global DEBUG switch
app.set('DEBUG', config.debugging.DEBUG);
// plus another also very ugly TRACE switch
app.set('TRACE', config.debugging.TRACE);

// the path to the file system where the rfid tags and Media Files are stored
app.set('rfidTagDir', config.directories.rfidTagDir);
app.set('MediaDir', config.directories.MediaDir);
app.set('SoundDir', config.directories.SoundDir);

// http and rest api endpoint for the player
app.set('AppName', config.playerEndpoint.AppName);
app.set('playerProtocol', config.playerEndpoint.Protocol);
app.set('playerHost', config.playerEndpoint.Host);
app.set('playerPort', Number(config.playerEndpoint.Port));
app.set('playerApi', config.playerEndpoint.Api);
app.set('playerUrl', config.playerEndpoint.Url);


// set the routes for different part of the application
var playerRoutes = require("./routes/routes_player.js")(app);

// get the info on where we are running
var AppName = app.get('AppName');
var svrProto = app.get('playerProtocol');
var svrAddr = app.get('playerHost');
var svrPort = app.get('playerPort');
var svrApi = app.get('playerApi');
var svrUrl = app.get('playerUrl');

var server = app.listen(port, function () {
    console.log("%s listening on %s://%s:%s API Endpoint is %s%s...", AppName, svrProto, svrAddr, svrPort, svrApi, svrUrl);
});
