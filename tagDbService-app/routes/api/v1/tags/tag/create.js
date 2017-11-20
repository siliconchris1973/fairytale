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

// the root entry shall show what could be done
tagRoutes.get(tagDbServiceApi+"/tags/tag/create", function(req, res) {
  if (DEBUG) console.log('get::/tags/tag/create called');
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log("   html request");
    res.render('create_tag', {
      title: 'Neues RFID Tag registrieren',
      subheadline: 'Neues RFID Tag registrieren',
      messagetext: 'Bitte Daten f&uuml;r das neue Tag eintragen und Dateien ausw&auml;hlen',
    });
  } else {
    if (TRACE) console.log("   json request");
    res.json({
      response: 'unavailable',
      status: 415,
      message: 'this endpoint is not available for json requests'
    });
  }
});

module.exports = tagRoutes;
