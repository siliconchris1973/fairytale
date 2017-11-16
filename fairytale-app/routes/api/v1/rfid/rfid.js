var path = require('path');
var fs = require('fs');
var http = require('http');

var config = require('../../../../modules/configuration.js');

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

var rfidController = require('../../../../controller/rfidController.js');

var rfidRouter = function(app) {
  // the root entry shall show what could be done
  app.get(rfidReaderApi+"/endpoints", function(req, res) {
    if (DEBUG) console.log('GET::'+svrApi+'/endpoints');
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');
    var obj = rfidController.getEndpoints(app);

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      res.render('endpoints', {
          title: 'Welcome to Fairytale RFID Reader',
          headline: 'RFID Reader API Endpunkte',
          subheadline: 'Verf&uuml;gbare REST Endpunkte f&uuml;r den RFID Reader',
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

  // root entry for RFID tag data
  app.get(rfidReaderApi+"/rfid", function(req, res) {
    if (DEBUG) console.log("rfid reader entry info requested");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    // holds the response data to be send as either html or json
    var responseContent = "";
    try {
      if (acceptsHTML) {
        if (DEBUG) console.log("html request");
        res.render('tags', {
          title: 'RFID Reader Startseite',
          headline: 'RFID Reader Startseite',
          subheadline: 'Willkommen',
          messagetext: 'Hier&uuml;ber kannst Du den RFID Reader ansprechen',
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
        if (DEBUG) console.log("json request");
        res.json({
          response: 'info endpoint to tags API',
          endpoints: [
                      {endpoint: rfidReaderProto + '://' + rfidReaderAddr + ':' + rfidReaderPort + rfidReaderApi + '/rfid', description: 'query (GET) the RFID reader'}
          ]
        });
      }
    } catch (ex) {
      console.error("could not query rfid reader \nException output: " + ex.toString());
      //process.exit();
      if (acceptsHTML) {
        res.render('rfid_error', {
          title: 'RFID Reader Fehlerseite',
          headline: 'RFID Reader Fehler',
          errorname: 'Error',
          errortext: 'could not query rfid reader',
          exceptionname: 'Exception',
          exceptiontext: ex.toString(),
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
        res.json({
          response: 'error',
          message: 'could not query rfid reader',
          exception: ex.toString()
        });
      }
    }
  })
}

module.exports = rfidRouter;
