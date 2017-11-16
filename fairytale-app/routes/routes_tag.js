var path = require('path');
var fs = require('fs');
var http = require('http');

var config = require('../modules/configuration.js');

// CONFIG data on the app
const svrAppName = config.appEndpoint.AppName;
const svrProtocol = config.appEndpoint.Protocol;
const svrHost = config.appEndpoint.Host;
const svrPort = Number(config.appEndpoint.Port);
const svrApi = config.appEndpoint.Api;
const svrUrl = config.appEndpoint.Url;
const svrHealthUri = config.appEndpoint.HealthUri;
const svrHelpUri = config.appEndpoint.HelpUri;
const svrDescription = config.appEndpoint.Description;

// CONFIG data on the file Upload Service
const fileServiceAppName = config.fileServiceEndpoint.AppName;
const fileServiceProtocol = config.fileServiceEndpoint.Protocol;
const fileServiceHost = config.fileServiceEndpoint.Host;
const fileServicePort = Number(config.fileServiceEndpoint.Port);
const fileServiceApi = config.fileServiceEndpoint.Api;
const fileServiceUrl = config.fileServiceEndpoint.Url;
const fileServiceHealthUri = config.fileServiceEndpoint.HealthUri;
const fileServiceHelpUri = config.fileServiceEndpoint.HelpUri;
const fileServiceDescription = config.fileServiceEndpoint.Description;

// CONFIG data on the RFID/NFC Reader Service
const rfidReaderAppName = config.rfidReaderEndpoint.AppName;
const rfidReaderProtocol = config.rfidReaderEndpoint.Protocol;
const rfidReaderHost = config.rfidReaderEndpoint.Host;
const rfidReaderPort = Number(config.rfidReaderEndpoint.Port);
const rfidReaderApi = config.rfidReaderEndpoint.Api;
const rfidReaderUrl = config.rfidReaderEndpoint.Url;
const rfidReaderHealthUri = config.rfidReaderEndpoint.HealthUri;
const rfidReaderHelpUri = config.rfidReaderEndpoint.HelpUri;
const rfidReaderDescription = config.rfidReaderEndpoint.Description;

// CONFIG data on the RFID/NFC Tag DB Service
const tagDbServiceAppName = config.tagDbServiceEndpoint.AppName;
const tagDbServiceProtocol = config.tagDbServiceEndpoint.Protocol;
const tagDbServiceHost = config.tagDbServiceEndpoint.Host;
const tagDbServicePort = Number(config.tagDbServiceEndpoint.Port);
const tagDbServiceApi = config.tagDbServiceEndpoint.Api;
const tagDbServiceUrl = config.tagDbServiceEndpoint.Url;
const tagDbServiceHealthUri = config.tagDbServiceEndpoint.HealthUri;
const tagDbServiceHelpUri = config.tagDbServiceEndpoint.HelpUri;
const tagDbServiceDescription = config.tagDbServiceEndpoint.Description;

// CONFIG data on the MP3 Player
const playerAppName = config.playerEndpoint.AppName;
const playerProtocol = config.playerEndpoint.Protocol;
const playerHost = config.playerEndpoint.Host;
const playerPort = Number(config.playerEndpoint.Port);
const playerApi = config.playerEndpoint.Api;
const playerUrl = config.playerEndpoint.Url;
const playerHealthUri = config.playerEndpoint.HealthUri;
const playerHelpUri = config.playerEndpoint.HelpUri;
const playerDescription = config.playerEndpoint.Description;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

const soundDir = config.directories.SoundDir;
const mediaDir = config.directories.MediaDir;
const tagDB = config.directories.TagDB;
var rfidTagDir = tagDB;

var tagController = require('../controller/tagController.js');

var tagRouter = function(app) {
  var genServerUrl = tagDbServiceProtocol + '://' + tagDbServiceHost + ':' + tagDbServicePort + tagDbServiceApi;
  var genPlayerUrl = playerProtocol + '://' + playerHost + ':' + playerPort + playerApi + playerUrl;

  app.get("/tags", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.redirect(tagDbServiceApi+"/tags");
    } else {
      if (DEBUG) console.log("json request");
      res.json({
        response: 'unavailable',
        status: 415,
        message: 'this endpoint is not available for json requests',
        redirect: tagDbServiceApi+'/tags'
      });
    }
  });
  app.get("/tags/tag/:id", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.redirect(tagDbServiceApi+"/tags/tag/:id");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'unavailable',
          status: 415,
          message: 'this endpoint is not available for json requests',
          redirect: tagDbServiceApi+'/tags/tag/:id'
        });
    }
  });
  app.get("/tags/tag/create", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.redirect(tagDbServiceApi+"/tags/tag/create");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'unavailable',
          status: 415,
          message: 'this endpoint is not available for json requests',
          redirect: tagDbServiceApi+'/tags/tag'
        });
    }
  });
  app.get("/tags/info", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.redirect(tagDbServiceApi+"/tags/info");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'unavailable',
          status: 415,
          message: 'this endpoint is not available for json requests',
          redirect: tagDbServiceApi+"/tags/info"
        });
    }
  });


  // the root entry shall show what could be done
  app.get(tagDbServiceApi+"/endpoints", function(req, res) {
    if (DEBUG) console.log('GET::'+svrApi+'/endpoints');
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');
    var obj = tagDbServiceController.getEndpoints(app);

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      res.render('endpoints', {
          title: 'Welcome to Fairytale Player',
          headline: 'Willkommen im Märchenschloss',
          subheadline: 'Verf&uuml;gbare REST Endpunkte f&uuml;r die Tag DB',
          messagetext: '&Uuml;ber die Navigation kannst Du die einzelnen Funktionen ausw&auml;hlen',
          varEndpoints: obj.endpoints
      });
    } else {
      if (DEBUG) console.log("json request");
      var respEndpoints = {
        response: 'REST API Endpoints available',
        endpoints: obj.endpoints
        };
      res.json(respEndpoints);
    }
  });

  app.get(tagDbServiceApi+"/tags/info", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/info");
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');
    var obj = tagController.getEndpoints(app);
    var responseJson = {
      headline: 'MP3 Player API Infoseite',
      subheadline: 'API Endpunkte',
      messagetext: 'Folgende Endpunkte sind über die API des Players erreichbar',
      endpoints: obj.endpoints
    };

    res.setHeader('X-Powered-By', 'bacon');

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      var endObj = responseJson;
      res.render('player_nav', endObj);
    } else {
      if (DEBUG) console.log("json request");
      res.json(playerEndpoints);
    }
  });

  // get the listing of all stored rfid tags
  app.get(tagDbServiceApi+"/tags", function(req, res) {
    if (DEBUG) console.log('get::/tags called');

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    /* promise call
    var result = function(app) {
      tagController.getTagList
      .then(function (result){
        var obj = result;
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          if (DEBUG) console.log("request to render tag list");
          if (TRACE) console.log(obj.tags);
          res.render('tags', {
            title: 'RFID Tag Startseite',
            headline: 'RFID Tag Startseite',
            subheadline: 'Verf&uuml;gbare Tags',
            messagetext: 'Bitte ein RFID Tag ausw&auml;hlen, um mehr Daten angezeigt zu bekommen',
            varTags: obj.tags
          });
        } else {
          res.json({
              info: {
                response: 'info',
                status: 200,
                message: 'endpoint to tags API',
                endpoints: result
              }
          });
        };
      })
      .catch(function(err){
        console.error('error: getting the list of tags failed\nerror message: ' + err.toString());
        if (acceptsHTML) {
          res.render('tags_error', {
            title: 'RFID Tag Fehlerseite',
            headline: 'RFID Tag Liste Fehler',
            errorname: 'Error',
            errortext: 'Fehler beim abrufen der Liste an verf&uuml;gbarer Tags ',
            exceptionname: 'Exception',
            exceptiontext: err.toString()
          })
        } else {
          console.log(err);
          res.send(err.toString());
        };
      });
    };
  */
  });

  // the root entry shall show what could be done
  app.get(tagDbServiceApi+"/tags/tag/create", function(req, res) {
    if (DEBUG) console.log('get::/tags/tag/create called');
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      res.render('create_tag', {
          title: 'Neues RFID Tag registrieren',
          subheadline: 'Neues RFID Tag registrieren',
          messagetext: 'Bitte Daten f&uuml;r das neue Tag eintragen und Dateien ausw&auml;hlen',
      });
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'unavailable',
          status: 415,
          message: 'this endpoint is not available for json requests'
        });
    }
  });

  // get the the content of one stored rfid tag
  app.get(tagDbServiceApi+"/tags/tag/:id", function(req, res) {
    if (DEBUG) console.log('get::/tags/tag/:id called');

    var rfidTagFile = 'NOTAG';
    var rfidTagFileSuffix = 'json';

    /* This is how a typical rfid tag with data to an audiobook looks like
    {
      "tagdata":
        {
          "TagChecksum": "0x23",
          "TagId": "75EDB4",
          "TagPreTag": "0xf00",
          "TagRawData": "0F0075EDB423",
          "MediaTitle": "Frederick"
        },
      "MediaType": "Hoerspiel"
      "MediaGenre": "Kindergeschichte",
      "MediaDescription": "Ein Hörspiel mit Musik zu Frederick der kleinen Maus",
      "TrackCount":
        [
          {
            "disk": "1", "tracks": "1"
          }
        ],
      "DiskCount": "1",
      "MediaFileName":[
        {
          "disk": "1",
          "part": "1",
          "id": "75EDB4:d1:p1",
          "name": "Frederick.mp3",
          "path": "Media/Disk_1/Frederick.mp2",
          "size": "24M"
        }
      ],
      "MediaPicture": [
        {
          "pic": "1",
          "name": "Frederick.jpg",
          "path": "Cover/normal/Frederick.jpg"
        }
      ]
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
            status: 400,
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
        var pictureCount=0;
        var trackCount=0;

        if (DEBUG) console.log("html request");
        tagController.getTagData(app, tag, function(err, result) {
          if (err) {
            var errObj = err;
            console.error(errObj);
            res.render('tags_error', {
              title: 'RFID Tag Fehlerseite',
              headline: 'RFID Tag Fehler',
              errorname: 'Error',
              errortext: 'Fehler beim abrufen der Daten f&uuml;r ' + tag,
              exceptionname: 'Exception',
              exceptiontext: errObj.error
            });
          } else {
            var obj = result;
            if (DEBUG) console.log('providing data to form');
            if (TRACE) console.log(obj);
            if (obj.MediaFiles.length > 0) {
              trackCount = obj.MediaFiles.length;
            }
            if (obj.MediaPicture.length > 0) {
              pictureCount = obj.MediaPicture.length;
            }
            res.render('showtag', {
                title: 'RFID Tag Datenseite',
                headline: 'RFID Tag Daten',
                subheadline: 'Tag ' + obj.tagdata.TagId + ' - ' + obj.MediaTitle,
                varTagId: obj.tagdata.TagId,
                varTagPreTag: obj.tagdata.TagPreTag,
                varTagChecksum: obj.tagdata.TagChecksum,
                varTagRawData: obj.tagdata.TagRawData,
                varMediaTitle: obj.MediaTitle,
                varMediaType: obj.MediaType,
                varMediaGenre: obj.MediaGenre,
                varMediaDescription: obj.MediaDescription,
                varMediaFiles: obj.MediaFiles,
                varDiskCount: obj.DiskCount,
                varTrackCount: trackCount,
                varMediaPictures: obj.MediaPicture,
                varPictureCount: pictureCount,
                serverUrl: genServerUrl,
                playerUrl: genPlayerUrl
            });
          }
        });
      } else {
        if (DEBUG) console.log("json request");
        // in case we shall output JSON it's quite simple, as the stored tag dat ais already json
        tagController.getTagData(app, tag, function(err, result) {
          if (err) {
            var errObj = err;
            console.error(errObj);
            res.json(errObj);
          } else {
            var obj = result;
            if (TRACE) console.log(obj);
            res.json(obj);
          }
        });
      }
    }
  })

  // get the the content of one stored rfid tag
  app.get(tagDbServiceApi+"/tags/playdata/:id", function(req, res) {
    if (DEBUG) console.log('get::/tags/playdata/:id called');

    var rfidTagFile = 'NOTAG';
    var rfidTagFileSuffix = 'json';

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.params.id) {
      console.error("rfid tag error: no tag identifier provided")

      if (acceptsJSON) {
        res.json({
            response: 'error',
            status: 400,
            message: 'no tag identifier provided'
        });
      } else {
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Interface Fehler',
          errorname: 'Error',
          errortext: 'Dieser Endpoint unterstützt keinen HTML-Client',
          exceptionname: 'Exception',
          exceptiontext: 'keine Exception aufgetreten',
        });
      }
    } else {
      var tag = req.params.id.toString().toUpperCase();
      rfidTagFile = tag + "." + rfidTagFileSuffix;
      if (DEBUG) console.log('data for tag ' + tag + ' requested');

      if (acceptsJSON) {
        if (DEBUG) console.log("json request");
        // in case we shall output JSON it's quite simple, as the stored tag dat ais already json
        tagController.getTagToPlay(app, tag, function(err, result) {
          if (err) {
            var errObj = err;
            console.error(errObj);
            res.json(errObj);
          } else {
            var obj = result;
            if (TRACE) console.log(obj);
            res.json(obj);
          }
        });
      } else {
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Interface Fehler',
          errorname: 'Error',
          errortext: 'Dieser Endpoint unterstützt keinen HTML-Client',
          exceptionname: 'Exception',
          exceptiontext: 'keine Exception aufgetreten',
        });
      }
    }
  })
  // store the current played position of the last track for the rfid tag
  app.post(tagDbServiceApi+"/tags/playdata/:id", function(req, res) {
    if (DEBUG) console.log('post::/tags/playdata/:id called');

    var rfidTagFile = 'NOTAG';
    var rfidTagFileSuffix = 'json';

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.params.id) {
      console.error("rfid tag error: no tag identifier provided")

      if (acceptsJSON) {
        res.json({
            response: 'error',
            status: 400,
            message: 'no tag identifier provided'
        });
      } else {
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Interface Fehler',
          errorname: 'Error',
          errortext: 'Dieser Endpoint unterstützt keinen HTML-Client',
          exceptionname: 'Exception',
          exceptiontext: 'keine Exception aufgetreten',
        });
      }
    } else {
      var tag = req.params.id.toString().toUpperCase();
      rfidTagFile = tag + "." + rfidTagFileSuffix;
      if (DEBUG) console.log('data for tag ' + tag + ' requested');

      if (acceptsJSON) {
        if (DEBUG) console.log("json request");
        // in case we shall output JSON it's quite simple, as the stored tag dat ais already json
        tagController.writeTagDataSync(app, tag, content, function(err, result) {
          if (err) {
            var errObj = err;
            console.error(errObj);
            res.json(errObj);
          } else {
            var obj = result;
            if (TRACE) console.log(obj);
            res.json(obj);
          }
        });
      } else {
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Interface Fehler',
          errorname: 'Error',
          errortext: 'Dieser Endpoint unterstützt keinen HTML-Client',
          exceptionname: 'Exception',
          exceptiontext: 'keine Exception aufgetreten',
        });
      }
    }
  })
  // target of the create a new rfid tag form
  app.post(tagDbServiceApi+"/tags/tag/:id", function(req, res) {
    if (DEBUG) console.log('post::/tags/tag/:id  called');

    // the server checks whether the client accepts html (browser) or
    // json (machine to machine) communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (TRACE) console.log('request body: ');
    if (TRACE) console.log(req.body);
    if (DEBUG) console.log("response code " + res.statusCode);
    if (TRACE) console.log('MediaFiles: ');
    if (TRACE) console.log(req.MediaFiles);
    if (TRACE) console.log('CoverFiles: ');
    if (TRACE) console.log(req.CoverFiles);

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
      if (DEBUG) console.log('getting all data for the tag from the form');
      // assuming everything went well, extract all raw data from the form
      var MediaTitle = req.body.MediaTitle;
      var Description = req.body.Description;
      var MediaFile = req.body.MediaFile;
      var CoverFile = req.body.CoverFile;
      var TagRawData = req.body.TagRawData.toUpperCase();
      var TagChecksum = '0X' + TagRawData.substr(10).toUpperCase();
      var TagPreTag = '0X' + TagRawData.substr(1,3).toUpperCase();
      var TagId = TagRawData.substr(4,6).toUpperCase();

      jsonContent = {
        MediaTitle: MediaTitle,
        MediaDescription: Description,
        MediaFileName: MediaFile,
        MediaPicture: CoverFile,
        TagRawData: TagRawData,
        TagChecksum: TagChecksum,
        TagPreTag: TagPreTag,
        TagId: TagId
      };

      if (TRACE) console.log('This is the created json:\n' + jsonContent);

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

  // target of the create a new rfid tag form
  app.post(tagDbServiceApi+"/tags/tag/:id/picture", function(req, res) {
    if (DEBUG) console.log('post::/tags/tag/:id/picture  called');

    // the server checks whether the client accepts html (browser) or
    // json (machine to machine) communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    // get the last url the user was on (or / if nothing was found) ...
    var backURL=req.header('Referer') || '/';
    var CoverFile = req.body.CoverFile;

    // get form content
    if (TRACE) console.log('request body: ');
    if (TRACE) console.log(req.body);
    if (DEBUG) console.log("response code " + res.statusCode);
    if (TRACE) console.log('CoverFile: ' + CoverFile);
    if (TRACE) console.log('back URL:' + backURL);

    if(!req.params.id) {
      console.error("error: no tag identifier provided")

      if (acceptsHTML) {
        if (DEBUG) console.log('rendering page tags_error');
        res.render('tags_error', {
          title: 'RFID Tag Fehlerseite',
          headline: 'RFID Tag Fehler',
          errorname: 'Error',
          errortext: 'Kein Tag Identifier &uuml;bermittelt',
          exceptionname: 'Exception',
          exceptiontext: 'keine Exception aufgetreten',
        });
      } else {
        if (DEBUG) console.log('returning json error response');
        res.json({
          response: 'error',
          message: 'no tag identifier provided'
        });
      }
    } else {
      // get the id of teh tag from request url
      var tagId = req.params.id;
      if (DEBUG) console.log('post::/tags/tag/'+tagId+'/picture  all set. we have a tag ('+tagId+') and a new image ('+CoverFile+'), so lets start');

      try {
        // first lets try to upload the picture
        tagController.uploadFile(app, req.body.CoverFile, function(err, result) {
          if (DEBUG) console.log('function to call rest api of fileService called')
          if (err) {
            console.error('error: uploading file '+req.body.CoverFile+' for tag '+tagId+' failed - ' + err.toString());
          } else {
            console.log('success: upload of file ' + req.body.CoverFile + ' successful');
            if (TRACE) console.log('result: '+ result.toString());

            if (DEBUG) console.log('now, after file was uploaded, add the picture meta data to the json file');
          }
        });
      } catch (ex) {
        console.error('EXCEPTION: Update of picture data with file upload failed - ' + ex.toString());
      }
    }

    /*
    try {
      // first lets try to upload the picture
      tagController.uploadFile(app, req.body.CoverFile, function(err, result) {
        if (DEBUG) console.log('function to call rest api of fileService called')
        if (err) {
          console.error('error: uploading file '+req.body.CoverFile+' for tag '+tagId+' failed - ' + err.toString());
        } else {
          console.log('success: upload of file ' + req.body.CoverFile + ' successful');
          if (TRACE) console.log('result: '+ result.toString());

          if (DEBUG) console.log('now, after file was uploaded, add the picture meta data to the json file');
          tagController.addPictureData(app, tagId, CoverFile, function(err, result) {
            if (err) {
              console.error('error: error while adding data for tag ' + tagId + '\n   error message: ' + err.toString());
              if (acceptsHTML) {
                if (DEBUG) console.log("html request");
                if (DEBUG) console.log('rendering page tags_error');
                res.render('tags_error', {
                  title: 'RFID Tag Fehlerseite',
                  headline: 'RFID Tag Fehler',
                  errorname: 'Error',
                  errortext: 'Fehler beim aktualisieren der Daten f&uuml;r ' + tagId,
                  exceptionname: 'Exception',
                  exceptiontext: err.toString()
                });
              } else {
                res.json({response: 'error',
                          message: 'error while updating meta data for tag ' + tagId,
                          error: err.toString()
                        });
              }
            } else {
              var obj = result;
              if (acceptsHTML) {
                if (DEBUG) console.log('rendering page showtag');
                if (TRACE) console.log(obj);
                // reload showtag again
                res.render('showtag', {
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
              } else {
                res.json({obj});
              }
            }
          });
        }
      });
    } catch (ex) {
      console.error('EXCEPTION: Update of picture data with file upload failed - ' + ex.toString());
    }
  }
    */
  })
}

module.exports = tagRouter;
