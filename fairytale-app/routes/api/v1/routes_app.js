var path = require('path');
var fs = require('fs');
var http = require('http');

var config = require('../../../modules/configuration.js');

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

var appController = require('../../../controller/appController.js');

var appRouter = function(app) {
  // the root entry shall show what could be done
  app.get(svrApi+"/", function(req, res) {
    if (DEBUG) console.log('GET::'+svrApi+'/');
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");

      res.render('content', {
          title: 'Welcome to Fairytale',
          headline: 'Willkommen im Märchenschloss',
          subheadline: 'W&auml;hle eine Funktion',
          messagetext: '&Uuml;ber die Navigation kannst Du die einzelnen Funktionen ausw&auml;hlen',
      });
    } else {
      if (DEBUG) console.log("json request");
      var respEndpoints = {
        response: 'REST API Endpoints available',
        endpoints: appEndpoints
        };
      res.json(respEndpoints);
    }
  });

  // the root entry shall show what could be done
  app.get(svrApi+"/endpoints", function(req, res) {
    if (DEBUG) console.log('GET::'+svrApi+'/endpoints');
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');
    var obj = appController.getEndpoints(app);

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      res.render('endpoints', {
          title: 'Welcome to Fairytale',
          headline: 'Willkommen im Märchenschloss',
          subheadline: 'Verf&uuml;gbare REST Endpunkte zu den einzelnen Modulen',
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

  // the staus or health check endpoint
  app.get(svrApi+"/status", function(req, res) {
    if (DEBUG) console.log('GET::'+svrApi+'/status');
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");

      res.render('component_status', {
          title: 'Komponentenstatus',
          headline: 'Komponentenstatus',
          subheadline: 'Status der einzelnen Komponenten...'
      });
    } else {
      if (DEBUG) console.log("json request");
      var respEndpoint = {
        response: 'status information requested',
        endpoints: appEndpoints
      };
      res.json(respEndpoint);
    }
  });
}

module.exports = appRouter;
