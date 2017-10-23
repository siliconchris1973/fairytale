var express = require('express'),
  app = express(),
  // TODO: I'd like to put the server stuff in server.js but for now, it's here
  port = process.env.PORT || 3000,
  stylus = require('stylus'),
  nib = require('nib');

// set server address
app.set('svrAddr', 'http://127.0.0.1:3000');
// and a rather ugly global DEBUG switch
app.set('DEBUG', true);

// mongodb connection
var db = require('./modules/db');
var bodyParser = require("body-parser");
var path = require('path');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// these set static exposures for media files and pictures and such
app.use(express.static('Static'));
app.use(express.static('data'));
app.use(express.static('modules'));
app.set('/img', express.static('Static/img'));
app.set('/Media', express.static('data/Media'));
app.set('/Cover', express.static('data/Cover'));

// sets the path to the multimedia, cover and rfid tag files
// these settings are made available via app.get('variable name')
// from within all subsequent scripts
app.set('rfidTagDir', './data/rfidTagData');
app.set('mediaDir', './data/mediaDir');
app.set('dbStorage', './data/db');

// settings for the template engine pug
app.set('/views', express.static('/Views'));
app.set('view engine', 'pug');


// set the routes for different part of the application
var appRoutes = require("./routes/routes_app.js")(app);
var tagRoutes = require("./routes/routes_tags.js")(app);
var rfidRoutes = require("./routes/routes_rfid.js")(app);
var playerRoutes = require("./routes/routes_player.js")(app);

var server = app.listen(port, function () {
    console.log("Listening on %s...", app.get('svrAddr'));
});
