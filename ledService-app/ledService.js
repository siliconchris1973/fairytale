const express = require('express'),
  led = express(),
  stylus = require('stylus'),
  nib = require('nib');

const routes = require("./routes");
led.use('/', routes);

// get the hostname of the server we run on
var os = require('os');
var path = require('path');
var fs = require('fs');

// get the global configuration
const config = require('./modules/configuration.js');

// how do we handle requests and parse the request body
var bodyParser = require("body-parser");
led.use(bodyParser.json());
led.use(bodyParser.urlencoded({ extended: true }));

// settings for the template engine pug
led.set('/views', express.static('/views'));
led.set('view engine', 'pug');

// these set static exposures for media files and pictures and such
led.use(express.static(path.resolve('./static')));
led.use(express.static(path.resolve('./views')));
led.set('/img', express.static(path.resolve('./static/img')));


// a rather ugly global DEBUG switch
led.set('DEBUG', config.debugging.DEBUG);
// plus another also very ugly TRACE switch
led.set('TRACE', config.debugging.TRACE);

// set server address
led.set('AppName', config.ledServiceEndpoint.AppName);
led.set('svrProtocol', config.ledServiceEndpoint.Protocol);
led.set('svrHost', config.ledServiceEndpoint.Host);
led.set('svrPort', Number(config.ledServiceEndpoint.Port));
led.set('svrApi', config.ledServiceEndpoint.Api);
led.set('svrUrl', config.ledServiceEndpoint.Url);

// get the info on where we are running
var AppName = led.get('AppName');
var svrProto = led.get('svrProtocol');
var svrAddr = led.get('svrHost');
var svrPort = led.get('svrPort');
var svrApi = led.get('svrApi');
var svrUrl = led.get('svrUrl');

var server = led.listen(svrPort, function () {
  try {
    var fairytale_ascii = fs.readFileSync('static/ascii/fairytale.txt').toString();
    var app_ascii = fs.readFileSync('static/ascii/led.txt').toString();
    console.log(fairytale_ascii);
    console.log(app_ascii);
  } catch (ex) {console.error('could not read ascii art')}
  console.log("%s listening on %s://%s:%s API Endpoint is %s%s...", AppName, svrProto, svrAddr, svrPort, svrApi, svrUrl);
});
