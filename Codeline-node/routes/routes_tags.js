var path = require('path');
var fs = require('fs');
var rfidTagFile = "NOTAG";
var rfidTagFileSuffix = "json";
var tagController = require('../modules/tagController.js');

//multer object creation
var multer  = require('multer')
var audioStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/Media/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
  }
})
var coverStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/Cover/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
  }
})
var uploadAudio = multer({ storage: audioStorage })
var uploadCover = multer({ storage: coverStorage })

var tagRouter = function(app) {
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var svrAddr = app.get('svrAddr');
  var mediaDir = app.get('mediaDir');
  var rfidTagDir = app.get('rfidTagDir')
  var listOfTags = '';

  // get the listing of all stored rfid tags
  app.get("/tags", function(req, res) {
      if (DEBUG) console.log("list all rfid tags requested");
      /* list all tags in rfid tag directory
      listOfTags = tagController.getTagList(app, function(listOfTags){
        console.log(listOfTags);
      });
      */
      // get content of one stored rfid tag
      //var tagData = require('../modules/rfidTag_fromFile.js')(app, '75CB73');
      //console.log(tagData);

      // the server checks whether the client accepts html (browser) or
      // json machine to machine communication
      var acceptsHTML = req.accepts('html');
      var acceptsJSON = req.accepts('json');

      /*
      responseContent = taglist(app);
      console.log('here comes the output: ');
      console.log(responseContent);
      */
      if (acceptsHTML) {
        tagController.getTagList(app, function(err, result) {
          if (err) {
              console.log(err);
              //Handle error response
          } else {
              res.render('tags', {
                  title: 'RFID Tag Startseite',
                  headline: 'RFID Tag Startseite',
                  subheadline: 'Verf&uuml;gbare Tags',
                  messagetext: 'Bitte ein RFID Tag ausw&auml;hlen, um mehr Daten angezeigt zu bekommen',
                  bodyContent: result
              });
          }
        });
      } else {
        if (DEBUG) console.log("json request");
        tagController.getTagList(app, function(err, result) {
          if (err) {
              console.log(err);
              //Handle error response
          } else {
            res.json({
              result
              /*
                info: {
                  response: 'info endpoint to tags API',
                  endpoints: result
                }
                */
            });
          }
        });
      }
  })

  // the root entry shall show what could be done
  app.get("/tags/tag/create", function(req, res) {
    if (DEBUG) console.log("create tag entry requested");
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      res.render('tag_form', {
          title: 'Neues RFID Tag registrieren',
          subheadline: 'Neues RFID Tag registrieren',
          messagetext: 'Bitte Daten f&uuml;r das neue Tag eintragen und Dateien ausw&auml;hlen',
          controlheadline: 'Verf&uuml;gbare Kommandos'
      });
    } else {
      if (DEBUG) console.log("json request");
      res.json({response: 'unavailable', message: 'this endpoint is not available for json requests'});
    }
  });

  // get the the content of one stored rfid tag
  app.get("/tags/tag/:id", function(req, res) {
    if (DEBUG) console.log("list content of one rfid tag requested");

    /* This is how a typical rfid tag with data to an audiobook looks like
    {
      "TagChecksum": "0x23",
      "TagId": "75EDB4",
      "TagPreTag": "0xf00",
      "TagRawData": "0F0075EDB423",
      "MediaTitle": "Frederick",
      "MediaType": "UNDEFINED",
      "MediaGenre": "UNDEFINED",
      "MediaDescription": "Ein Hörspiel mit Musik zu Frederick der kleinen Maus",
      "MediaFileName": [{"part": "1", "name": "Frederick.mp3", "size": "24M"}],
      "MediaPicture": [{"pic": "1", "name": "Frederick.jpg"}],
      "MediaType": "Audiobook"
    }
    */

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.params.id) {
      console.error("rfid tag error: no tag identifier provided")

      if (acceptsHTML) {
        res.render('tags_error', {
          title: 'RFID Tag Fehlerseite',
          headline: 'RFID Tag Fehler',
          errorname: 'Error',
          errortext: 'Kein Tag Identifier &uuml;bermittelt',
          exceptionname: 'Exception',
          exceptiontext: 'keine Exception aufgetreten',
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
        res.json({
            response: 'error',
            message: 'no tag identifier provided'
        });
      }
    } else {
      var tag = req.params.id.toString().toUpperCase();
      rfidTagFile = tag + "." + rfidTagFileSuffix;
      if (DEBUG) console.log('data for tag ' + tag + ' requested');

      // check whether or not this is an interactive browser session or a
      // machine to machine communication.
      //    browser means we'll need to send html
      //    machine means we'll send a json structure
      if (acceptsHTML) {
        if (DEBUG) console.log("html request");
        tagController.getTagData(app, tag, function(err, result) {
          if (err) {
            console.log(err);
            res.render('tags_error', {
              title: 'RFID Tag Fehlerseite',
              headline: 'RFID Tag Fehler',
              errorname: 'Error',
              errortext: 'Fehler beim abrufen der Daten f&uuml;r ' + tag,
              exceptionname: 'Exception',
              exceptiontext: err.toString(),
              controlheadline: 'Verf&uuml;gbare Kommandos'
            });
          } else {
            var obj = result;
            if (DEBUG) console.log('providing following data to form:');
            if (DEBUG) console.log(obj);
            res.render('tags', {
                title: 'RFID Tag Datenseite',
                headline: 'RFID Tag Daten',
                subheadline: 'Tag ' + obj.TagId + ' - ' + obj.MediaTitle,
                varTagId: obj.TagId,
                varTagPreTag: obj.TagPreTag,
                varTagChecksum: obj.TagChecksum,
                varTagRawData: obj.TagRawData,
                varMediaTitle: obj.MediaTitle,
                varMediaType: obj.MediaType,
                varMediaGenre: obj.MediaGenre,
                varMediaDescription: obj.MediaDescription,
                varMediaFiles: obj.MediaFileName,
                varMediaPictures: obj.MediaPicture
            });
          }
        });
      } else {
        if (DEBUG) console.log("json request");
        // in case we shall output JSON it's quite simple, as the stored tag dat ais already json
        tagController.getTagData(app, tag, function(err, result) {
          if (err) {
            console.log(err);
            res.json({
                response: 'error',
                message: 'could not read data for tag ' + tag,
                exception: err.toString()
            });
          } else {
            var obj = result;
            res.json(obj);
          }
        });
      }
    }
  })

  // target of the create a new rfid tag form
  app.post("/tags/tag", uploadAudio.single('MediaFile'), uploadCover.single('CoverFile'), function(req, res) {
    if (DEBUG) console.log("post request to create new tag");

    // the server checks whether the client accepts html (browser) or
    // json (machine to machine) communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (DEBUG) console.log('request body: ');
    if (DEBUG) console.log(req.body);
    if (DEBUG) console.log("response code " + res.statusCode);
    if (DEBUG) console.log('MediaFiles: ');
    if (DEBUG) console.log(req.MediaFiles);
    if (DEBUG) console.log('CoverFiles: ');
    if (DEBUG) console.log(req.CoverFiles);

    if (res.statusCode < 200 || res.statusCode > 299){
      // TODO: very ugly error routine here
      var errortype = 'unknown';
      if (res.statusCode > 0 && res.statusCode < 200) {
        errortype = 'processing (unusual)';
      } else if (res.statusCode > 299 && res.statusCode < 400) {
        errortype = 'redirect received';
      } else if (res.statusCode > 499 && res.statusCode < 500) {
        errortype = 'client error';
      } else if (res.statusCode > 500 && res.statusCode < 599){
        errortype = 'server error';
      } else {
        errortype = 'unknown';
      }

      if (acceptsHTML) {
        res.render('tags_error', {
          title: 'RFID Tag Fehlerseite',
          headline: 'RFID Tag Fehler',
          errorname: 'Error ' + res.statusCode,
          errortext: 'error creating new RFID Tag',
          exceptionname: 'http response',
          exceptiontext: errortype,
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
        res.json({
            response: 'error',
            status: res.statusCode,
            errortype: errortype,
            message: 'error creating new RFID Tag'
        });
      }
    } else {
      // assuming everything went well, extract all raw data from the form
      var MediaTitle = req.body.MediaTitle;
      var Description = req.body.Description;
      var MediaFile = req.body.MediaFile;
      var CoverFile = req.body.CoverFile;
      var TagRawData = req.body.TagRawData.toUpperCase();
      var TagChecksum = '0X' + TagRawData.substr(10).toUpperCase();
      var TagPreTag = '0X' + TagRawData.substr(1,3).toUpperCase();
      var TagId = TagRawData.substr(4,6).toUpperCase();

      jsonContent = '{\n  \'MediaTitle\': \'' + MediaTitle + '\',\n  \'AbookDescription\': \'' + Description + '\',\n  \'MediaFile\': \'' + MediaFile + '\',\n  \'CoverFile\': \'' + CoverFile + '\',\n  \'TagRawData\': \'' + TagRawData + '\',\n  \'TagChecksum\': \'' + TagChecksum + '\',\n  \'TagPreTag\': \'' + TagPreTag + '\',\n  \'TagId\': \'' + TagId + '\'\n}';

      if (DEBUG) console.log('This is the created json:\n' + jsonContent);

      if (acceptsHTML) {
        res.render('tags', {
          title: 'RFID Tags',
          headline: 'RFID Tags',
          subheadline: 'Neues RFID Tag erzeugt',
          messagetext: 'Titel: ' + MediaTitle + '<br>Beschreibung: ' + Description + '<br>Mediendatei: ' + MediaFile + '<br>Coverbild: ' + CoverFile + '<br>RFID Tag: ' + TagId + '<br>',
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
        res.json({
            response: 'info',
            message: 'provded data for new tag ' + TagId,
            content: jsonContent
        });
      }
    }
  })
}

module.exports = tagRouter;
