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

// CONFIG data on the Player
const playerAppName = config.playerEndpoint.AppName;
const playerProtocol = config.playerEndpoint.Protocol;
const playerHost = config.playerEndpoint.Host;
const playerPort = Number(config.playerEndpoint.Port);
const playerApi = config.playerEndpoint.Api;
const playerUrl = config.playerEndpoint.Url;
const playerHealthUri = config.playerEndpoint.HealthUri;
const playerHelpUri = config.playerEndpoint.HelpUri;
const playerDescription = config.playerEndpoint.Description;

var genServerUrl = tagDbServiceProtocol + '://' + tagDbServiceHost + ':' + tagDbServicePort + tagDbServiceApi;
var genPlayerUrl = playerProtocol + '://' + playerHost + ':' + playerPort + playerApi + playerUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

const soundDir = config.directories.SoundDir;
const mediaDir = config.directories.MediaDir;
const tagDB = config.directories.TagDB;
var nfcTagDir = tagDB;

// get the the content of one stored nfc tag
tagRoutes.get(tagDbServiceApi+tagDbServiceUrl+"/tag/:id/playdata", function(req, res) {
  if (DEBUG) console.log('get::'+tagDbServiceApi+tagDbServiceUrl+'/tag/:id/playdata called');

  var nfcTagFile = 'NOTAG';
  var nfcTagFileSuffix = 'json';

  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if(!req.params.id) {
    console.error("nfc tag error: no tag identifier provided")

    if (acceptsJSON) {
      if (TRACE) console.log("   json request");
      res.json({
          response: 'error',
          status: 400,
          message: 'no tag identifier provided'
      });
    } else {
      if (TRACE) console.log("   html request");
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
    nfcTagFile = tag + "." + nfcTagFileSuffix;
    if (DEBUG) console.log('data for tag ' + tag + ' requested');

    if (acceptsJSON) {
      if (TRACE) console.log("   json request");
      // in case we shall output JSON it's quite simple, as the stored tag dat ais already json
      tagDbServiceController.getTagToPlay(app, tag, function(err, result) {
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
      if (TRACE) console.log("   html request");
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

// store the current played position of the last track for the nfc tag
tagRoutes.post(tagDbServiceApi+tagDbServiceUrl+"/tag/:id/playdata", function(req, res) {
  if (DEBUG) console.log('post::'+tagDbServiceApi+tagDbServiceUrl+'/tag/:id/playdata called');

  var nfcTagFile = 'NOTAG';
  var nfcTagFileSuffix = 'json';

  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if(!req.params.id) {
    console.error("nfc tag error: no tag identifier provided")

    if (acceptsJSON) {
      if (TRACE) console.log("   json request");
      res.json({
          response: 'error',
          status: 400,
          message: 'no tag identifier provided'
      });
    } else {
      if (TRACE) console.log("   html request");
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
    nfcTagFile = tag + "." + nfcTagFileSuffix;
    if (DEBUG) console.log('data for tag ' + tag + ' requested');

    if (acceptsJSON) {
      if (TRACE) console.log("   json request");
      // in case we shall output JSON it's quite simple, as the stored tag dat ais already json
      tagDbServiceController.writeTagDataSync(app, tag, content, function(err, result) {
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
      if (TRACE) console.log("   html request");
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

module.exports = tagRoutes;
