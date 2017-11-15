var express = require('express'),
  app = express(),
  port = process.env.PORT || 3001,
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

// set server address
app.set('AppName', config.tagDbServiceEndpoint.AppName);
app.set('tagDbServiceProtocol', config.tagDbServiceEndpoint.Protocol);
app.set('tagDbServiceHost', config.tagDbServiceEndpoint.Hostname);
app.set('tagDbServicePort', Number(config.tagDbServiceEndpoint.Port));
app.set('tagDbServiceApi', config.tagDbServiceEndpoint.Api);
app.set('tagDbServiceUrl', config.tagDbServiceEndpoint.Url);


// set the routes for different part of the application
var tagRoutes = require("./routes/routes_tag.js")(app);

var AppName = app.get('AppName');
var svrProto = app.get('tagDbServiceProtocol');
var svrAddr = app.get('tagDbServiceHost');
var svrPort = app.get('tagDbServicePort');
var svrApi = app.get('tagDbServiceApi');
var svrUrl = app.get('tagDbServiceUrl');

var server = app.listen(port, function () {
    console.log("%s listening on %s://%s:%s API Endpoint is %s%s...", AppName, svrProto, svrAddr, svrPort, svrApi, svrUrl);
});
