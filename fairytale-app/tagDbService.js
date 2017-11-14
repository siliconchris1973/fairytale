var express = require('express'),
  app = express(),
  port = process.env.PORT || 3001,
  stylus = require('stylus'),
  nib = require('nib');

// get the hostname of the server we run on
var os = require('os');

// how do we handle requests and parse the request body
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// these set static exposures for media files and pictures and such
app.use(express.static('static'));
app.use(express.static('modules'));
app.use(express.static('views'));
app.use(express.static('../data'));

// these settings are made available via app.get('variable name')
// from within all subsequent scripts
// a rather ugly global DEBUG switch
app.set('DEBUG', true);
// plus another also very ugly TRACE switch
app.set('TRACE', true);

// access to static content, the media and tag files
app.set('/img', express.static('/static/img'));
app.set('/Media', express.static('../data/Media'));
app.set('/TagDB', express.static('../data/TagDB'));

// the path to the file system where the rfid tags and Media Files are stored
app.set('rfidTagDir', config.directories.rfidTagDir);
app.set('MediaDir', config.directories.MediaDir);
app.set('SoundDir', config.directories.SoundDir);

// settings for the template engine pug
app.set('/views', express.static('/views'));
app.set('view engine', 'pug');


// set server address
app.set('AppName', config.tagDbEndpoint.AppName);
app.set('tagDbServiceProto', config.tagDbEndpoint.Protocol);
app.set('tagDbServiceAddr', config.tagDbEndpoint.Hostname;
app.set('tagDbServicePort', Number(config.tagDbEndpoint.Port));
app.set('tagDbServiceApi', config.tagDbEndpoint.Api);
app.set('tagDbServiceUrl', config.tagDbEndpoint.Url);


// set the routes for different part of the application
var appRoutes = require("./routes/routes_tagDb.js")(app);

var AppName = app.get('AppName');
var svrProto = app.get('svrProtocol');
var svrAddr = app.get('svrHost');
var svrPort = app.get('svrPort');
var svrApi = app.get('svrApi');
var svrUrl = app.get('svrUrl');

var server = app.listen(port, function () {
    console.log("%s listening on %s://%s:%s API Endpoint is %s%s...", AppName, svrProto, svrAddr, svrPort, svrApi, svrUrl);
});
