var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000;

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

var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
});
