const express = require('express'),
  app = express(),
  stylus = require('stylus'),
  nib = require('nib');

const routes = require("./routes");
app.use('/', routes);

// get the hostname of the server we run on
var os = require('os');
var path = require('path');
var fs = require('fs');

// get the global configuration
const config = require('./modules/configuration.js');

// how do we handle requests and parse the request body
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// settings for the template engine pug
app.set('/views', express.static('/views'));
app.set('view engine', 'pug');

// these set static exposures for media files and pictures and such
app.use(express.static(path.resolve('./static')));
app.use(express.static(path.resolve('./views')));
app.set('/img', express.static(path.resolve('./static/img')));


// a rather ugly global DEBUG switch
app.set('DEBUG', config.debugging.DEBUG);
// plus another also very ugly TRACE switch
app.set('TRACE', config.debugging.TRACE);

// http and rest api endpoint for the player
app.set('AppName', config.playerEndpoint.AppName);
app.set('playerProtocol', config.playerEndpoint.Protocol);
app.set('playerHost', config.playerEndpoint.Host);
app.set('playerPort', Number(config.playerEndpoint.Port));
app.set('playerApi', config.playerEndpoint.Api);
app.set('playerUrl', config.playerEndpoint.Url);

// get the info on where we are running
var AppName = app.get('AppName');
var svrProto = app.get('playerProtocol');
var svrAddr = app.get('playerHost');
var svrPort = app.get('playerPort');
var svrApi = app.get('playerApi');
var svrUrl = app.get('playerUrl');

var thePlayer = appController.instantiatePlayer();

var server = app.listen(svrPort, function () {
  try {
    var fairytale_ascii = fs.readFileSync('static/ascii/fairytale.txt').toString();
    var app_ascii = fs.readFileSync('static/ascii/player.txt').toString();
    console.log(fairytale_ascii);
    console.log(app_ascii);
  } catch (ex) {console.error('could not read ascii art')}
  console.log("%s listening on %s://%s:%s API Endpoint is %s%s...", AppName, svrProto, svrAddr, svrPort, svrApi, svrUrl);
});
