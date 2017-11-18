var path = require('path');
var fs = require('fs');
var http = require('http');

var config = require('../../../../modules/configuration.js');
var nfcController = require('../../../../controller/nfcController.js');

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
const nfcReaderAppName = config.nfcReaderEndpoint.AppName;
const nfcReaderProtocol = config.nfcReaderEndpoint.Protocol;
const nfcReaderHost = config.nfcReaderEndpoint.Host;
const nfcReaderPort = Number(config.nfcReaderEndpoint.Port);
const nfcReaderApi = config.nfcReaderEndpoint.Api;
const nfcReaderUrl = config.nfcReaderEndpoint.Url;
const nfcReaderHealthUri = config.nfcReaderEndpoint.HealthUri;
const nfcReaderHelpUri = config.nfcReaderEndpoint.HelpUri;
const nfcReaderDescription = config.nfcReaderEndpoint.Description;

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


var nfcRouter = function(app) {
  // the root entry shall show what could be done
  app.get(nfcReaderApi+"/endpoints", function(req, res) {
    if (DEBUG) console.log('GET::'+svrApi+'/endpoints');
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');
    var obj = nfcController.getEndpoints(app);

    if (acceptsHTML) {
      if (TRACE) console.log("   html request");
      res.render('endpoints', {
          title: 'Welcome to Fairytale RFID Reader',
          headline: 'RFID Reader API Endpunkte',
          subheadline: 'Verf&uuml;gbare REST Endpunkte f&uuml;r den RFID Reader',
          messagetext: '&Uuml;ber die Navigation kannst Du die einzelnen Funktionen ausw&auml;hlen',
          varEndpoints: obj.endpoints
      });
    } else {
      if (TRACE) console.log("   json request");
      var respEndpoints = {
        response: 'REST API Endpoints available',
        endpoints: obj.endpoints
        };
      res.json(respEndpoints);
    }
  });

  // root entry for RFID tag data
  app.get(nfcReaderApi+"/nfc", function(req, res) {
    if (DEBUG) console.log("nfc reader entry info requested");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    // holds the response data to be send as either html or json
    var responseContent = "";
    try {
      if (acceptsHTML) {
        if (TRACE) console.log("   html request");
        res.render('tags', {
          title: 'RFID Reader Startseite',
          headline: 'RFID Reader Startseite',
          subheadline: 'Willkommen',
          messagetext: 'Hier&uuml;ber kannst Du den RFID Reader ansprechen',
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
        if (TRACE) console.log("   json request");
        res.json({
          response: 'info endpoint to tags API',
          endpoints: [
                      {endpoint: nfcReaderProto + '://' + nfcReaderAddr + ':' + nfcReaderPort + nfcReaderApi + '/nfc', description: 'query (GET) the RFID reader'}
          ]
        });
      }
    } catch (ex) {
      console.error("could not query nfc reader \nException output: " + ex.toString());
      //process.exit();
      if (acceptsHTML) {
        if (TRACE) console.log("   html request");
        res.render('nfc_error', {
          title: 'RFID Reader Fehlerseite',
          headline: 'RFID Reader Fehler',
          errorname: 'Error',
          errortext: 'could not query nfc reader',
          exceptionname: 'Exception',
          exceptiontext: ex.toString(),
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
        if (TRACE) console.log("   json request");
        res.json({
          response: 'error',
          message: 'could not query nfc reader',
          exception: ex.toString()
        });
      }
    }
  })
}

module.exports = nfcRouter;
