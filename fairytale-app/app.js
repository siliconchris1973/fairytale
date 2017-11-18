const express = require('express'),
  app = express(),
  stylus = require('stylus'),
  nib = require('nib');

const routes = require("./routes");
app.use('/', routes);

// get the hostname of the server we run on
var os = require('os');
var path = require('path');

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

// set server address
app.set('AppName', config.appEndpoint.AppName);
app.set('svrProtocol', config.appEndpoint.Protocol);
app.set('svrHost', config.appEndpoint.Host);
app.set('svrPort', Number(config.appEndpoint.Port));
app.set('svrApi', config.appEndpoint.Api);
app.set('svrUrl', config.appEndpoint.Url);

// get the info on where we are running
var AppName = app.get('AppName');
var svrProto = app.get('svrProtocol');
var svrAddr = app.get('svrHost');
var svrPort = app.get('svrPort');
var svrApi = app.get('svrApi');
var svrUrl = app.get('svrUrl');

// set the routes for different part of the application
/* TODO delete OLD ROUTE SETTING
const appRoutes = require("./routes/routes_app.js")(app);
const appApiRoutes = require("./routes/api/v1/app.js")(app);
*/

var server = app.listen(svrPort, function () {
    console.log("%s listening on %s://%s:%s API Endpoint is %s%s...", AppName, svrProto, svrAddr, svrPort, svrApi, svrUrl);
});
