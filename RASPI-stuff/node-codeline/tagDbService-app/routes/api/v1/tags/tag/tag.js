const tagRoutes = require('express').Router();

var config = require('../../../../../modules/configuration.js');
var tagDbServiceController = require('../../../../../controller/tagDbServiceController.js');

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

var genServerUrl = tagDbServiceProtocol + '://' + tagDbServiceHost + ':' + tagDbServicePort + tagDbServiceApi;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

const soundDir = config.directories.SoundDir;
const mediaDir = config.directories.MediaDir;
const tagDB = config.directories.TagDB;
var nfcTagDir = tagDB;

// get the the content of one stored nfc tag
tagRoutes.get(tagDbServiceApi+tagDbServiceUrl+'/tag/:id', function(req, res) {
  if (DEBUG) console.log('get::'+tagDbServiceApi+tagDbServiceUrl+'/tag/:id called');

  var nfcTagFile = 'NOTAG';
  var nfcTagFileSuffix = 'json';

  /* This is how a typical nfc tag with data to an audiobook looks like
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
    console.error("nfc tag error: no tag identifier provided")

    if (acceptsHTML) {
      if (TRACE) console.log("   html request");
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
      if (TRACE) console.log("   json request");
      res.json({
          response: 'error',
          status: 400,
          message: 'no tag identifier provided'
      });
    }
  } else {
    var tag = req.params.id.toString().toUpperCase();
    nfcTagFile = tag + "." + nfcTagFileSuffix;
    if (DEBUG) console.log('data for tag ' + tag + ' requested');

    // check whether or not this is an interactive browser session or a
    // machine to machine communication.
    //    browser means we'll need to send html
    //    machine means we'll send a json structure
    if (acceptsHTML) {
      var pictureCount=0;
      var trackCount=0;

      if (TRACE) console.log("   html request");
      tagDbServiceController.getTagData(app, tag, function(err, result) {
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
      if (TRACE) console.log("   json request");
      // in case we shall output JSON it's quite simple, as the stored tag dat ais already json
      tagDbServiceController.getTagData(app, tag, function(err, result) {
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

// target of the create a new nfc tag form
tagRoutes.post(tagDbServiceApi+tagDbServiceUrl+'/tag/:id', function(req, res) {
  if (DEBUG) console.log('post::'+tagDbServiceApi+tagDbServiceUrl+'/tag/:id  called');

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
      if (TRACE) console.log("   html request");
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
      if (TRACE) console.log("   json request");
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
      if (TRACE) console.log("   html request");
      res.render('tags', {
        title: 'RFID Tags',
        headline: 'RFID Tags',
        subheadline: 'Neues RFID Tag erzeugt',
        messagetext: 'Titel: ' + MediaTitle + '<br>Beschreibung: ' + Description + '<br>Mediendatei: ' + MediaFile + '<br>Coverbild: ' + CoverFile + '<br>RFID Tag: ' + TagId + '<br>',
        controlheadline: 'Verf&uuml;gbare Kommandos'
      });
    } else {
      if (TRACE) console.log("   json request");
      res.json({
          response: 'info',
          message: 'provded data for new tag ' + TagId,
          content: jsonContent
      });
    }
  }
})

module.exports = tagRoutes;
