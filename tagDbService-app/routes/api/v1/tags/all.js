const tagRoutes = require('express').Router();

var config = require('../../../../modules/configuration.js');
var tagDbServiceController = require('../../../../controller/tagDbServiceController.js');

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

var tagDbServiceFullUrl = tagDbServiceProtocol + '://' + tagDbServiceHost + ':' + tagDbServicePort + tagDbServiceApi;
//var genPlayerUrl = playerProtocol + '://' + playerHost + ':' + playerPort + playerApi + playerUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

const soundDir = config.directories.SoundDir;
const mediaDir = config.directories.MediaDir;
const tagDB = config.directories.TagDB;
var nfcTagDir = tagDB;

// GET ALL Tags Endpoint
// get the listing of all stored nfc tags
tagRoutes.get(tagDbServiceApi+tagDbServiceUrl, function(req, res) {
  if (DEBUG) console.log('get::'+tagDbServiceApi+tagDbServiceUrl+' called');

  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  /* promise call
  var result = function(app) {
    tagDbServiceController.getTagList
    .then(function (result){
      var obj = result;
      if (acceptsHTML) {
        if (TRACE) console.log("   html request");
        if (DEBUG) console.log("request to render tag list");
        if (TRACE) console.log(obj.tags);
        res.status(200).render('tags', {
          title: 'RFID Tag Startseite',
          headline: 'RFID Tag Startseite',
          subheadline: 'Verf&uuml;gbare Tags',
          messagetext: 'Bitte ein RFID Tag ausw&auml;hlen, um mehr Daten angezeigt zu bekommen',
          varTags: obj.tags
        });
      } else {
        if (TRACE) console.log('   json request');
        res.status(200).json({
          info: {
            response: 'info',
            status: 200,
            status_text: '200 - ok'
            message: 'endpoint to tags API',
            endpoints: result
          }
        });
      };
    })
    .catch(function(err){
      console.error('error: getting the list of tags failed\nerror message: ' + err.toString());
      if (acceptsHTML) {
        if (TRACE) console.log('   html request');
        res.status(500).render('tags_error', {
          title: 'RFID Tag Fehlerseite',
          headline: 'RFID Tag Liste Fehler',
          errorname: 'Error',
          errortext: 'Fehler beim abrufen der Liste an verf&uuml;gbarer Tags ',
          exceptionname: 'Exception',
          exceptiontext: err.toString()
        });
      } else {
        if (TRACE) console.log('   json request');
        console.log(err);
        res.status(500).json({
          response: 'error',
          status: 500,
          status_text: '500 - internal server error',
          message: 'error retrieving data on available tags',
          error: err.toString()
        });
      };
    });
  };
*/
});

module.exports = tagRoutes;
