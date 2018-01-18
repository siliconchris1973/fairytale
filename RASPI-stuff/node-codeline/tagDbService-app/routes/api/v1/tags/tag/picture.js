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

// target of the create a new nfc tag form
tagRoutes.post(tagDbServiceApi+tagDbServiceUrl+'/tag/:id/picture', function(req, res) {
  if (DEBUG) console.log('post::'+tagDbServiceApi+tagDbServiceUrl+'/tag/:id/picture  called');

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
      if (TRACE) console.log("   html request");
      res.render('tags_error', {
        title: 'RFID Tag Fehlerseite',
        headline: 'RFID Tag Fehler',
        errorname: 'Error',
        errortext: 'Kein Tag Identifier &uuml;bermittelt',
        exceptionname: 'Exception',
        exceptiontext: 'keine Exception aufgetreten',
      });
    } else {
      if (TRACE) console.log("   json request");
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
      tagDbServiceController.uploadFile(app, req.body.CoverFile, function(err, result) {
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
    tagDbServiceController.uploadFile(app, req.body.CoverFile, function(err, result) {
      if (DEBUG) console.log('function to call rest api of fileService called')
      if (err) {
        console.error('error: uploading file '+req.body.CoverFile+' for tag '+tagId+' failed - ' + err.toString());
      } else {
        console.log('success: upload of file ' + req.body.CoverFile + ' successful');
        if (TRACE) console.log('result: '+ result.toString());

        if (DEBUG) console.log('now, after file was uploaded, add the picture meta data to the json file');
        tagDbServiceController.addPictureData(app, tagId, CoverFile, function(err, result) {
          if (err) {
            console.error('error: error while adding data for tag ' + tagId + '\n   error message: ' + err.toString());
            if (acceptsHTML) {
              if (TRACE) console.log("   html request");
              res.render('tags_error', {
                title: 'RFID Tag Fehlerseite',
                headline: 'RFID Tag Fehler',
                errorname: 'Error',
                errortext: 'Fehler beim aktualisieren der Daten f&uuml;r ' + tagId,
                exceptionname: 'Exception',
                exceptiontext: err.toString()
              });
            } else {
              if (TRACE) console.log("   json request");
              res.json({response: 'error',
                        message: 'error while updating meta data for tag ' + tagId,
                        error: err.toString()
                      });
            }
          } else {
            var obj = result;
            if (acceptsHTML) {
              if (TRACE) console.log("   html request");
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
              if (TRACE) console.log("   json request");
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

module.exports = tagRoutes;
