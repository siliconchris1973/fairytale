var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  stylus = require('stylus'),
  nib = require('nib');

// how do we handle requests and parse the request body
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// these set static exposures for media files and pictures and such
app.use(express.static('static'));
app.use(express.static('modules'));
app.use(express.static('views'));
app.use(express.static('/data'));

// these settings are made available via app.get('variable name')
// from within all subsequent scripts

// set server address
app.set('svrProto', 'http');
app.set('svrAddr', 'DeepThought');
app.set('svrPort', Number(3000));
app.set('svrApi', '/api/v1');
app.set('svrUrl', '/tags');

// this is for the second node.js app, that does the actual file uploading
app.set('fileServiceProto', 'http');
app.set('fileServiceAddr', 'DeepThought');
app.set('fileServicePort', Number(3001));
app.set('fileServiceApi', '/api/v1');
app.set('fileServiceUrl', '/file');

// this is for the thrid node.js app, that does the actual audio playback
app.set('playerProto', 'http');
app.set('playerAddr', 'DeepThought');
app.set('playerPort', Number(3002));
app.set('playerApi', '/api/v1');
app.set('playerUrl', '/player');

// this is for the 4th node.js app, that does the actual audio playback
app.set('rfidReaderProto', 'http');
app.set('rfidReaderAddr', 'DeepThought');
app.set('rfidReaderPort', Number(3003));
app.set('rfidReaderApi', '/api/v1');
app.set('rfidReaderUrl', '/rfid');


// and a rather ugly global DEBUG switch
app.set('DEBUG', true);
// plus another also very ugly TRACE switch
app.set('TRACE', true);

app.set('/img', express.static('/static/img'));

// this is the path to the file system where the rfid tags are stored
app.set('rfidTagDir', '/data/TagDB');
app.set('MediaDir', '/data/Media');

// settings for the template engine pug
app.set('/views', express.static('/views'));
app.set('view engine', 'pug');


// set the routes for different part of the application
var appRoutes = require("./routes/routes_app.js")(app);
var tagRoutes = require("./routes/routes_tags.js")(app);
//var rfidRoutes = require("./routes/routes_rfid.js")(app);
//var playerRoutes = require("./routes/routes_player.js")(app);

var svrProto = app.get('svrProto');
var svrAddr = app.get('svrAddr');
var svrPort = app.get('svrPort');
var svrApi = app.get('svrApi');

var server = app.listen(port, function () {
    console.log("Server listening on %s://%s:%s API Endpoint is %s...", svrProto, svrAddr, svrPort, svrApi);
});
