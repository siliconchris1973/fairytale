var express = require('express'),
  app = express(),
  // TODO: I'd like to put the server stuff in server.js but for now, it's here
  port = process.env.PORT || 3000;

// mongodb connection
var db = require('./modules/db');

var bodyParser = require("body-parser");
var path = require('path');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// some global directory stuff
var dataDir = "data"
var coverPicDir = path.join(dataDir, 'Cover');
var audioDataDir = path.join(dataDir, 'Audiobooks');
// holds the vars that define the json read/write operation specificas
var jsonFileDirectory = path.join(dataDir, 'rfidTagData');
var jsonFileSuffix = "json";


var routes = require("./routes/routes.js")(app);

var server = app.listen(port, function () {
    console.log("Listening on port %s...", server.address().port);
});
