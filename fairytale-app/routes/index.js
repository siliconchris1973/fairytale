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

var appRouter = function(app) {

  /*
   *       MAIN APP ROUTES FOR REDIRECTION
   */
  app.get("/", function(req, res) {
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(svrApi+'/');
    } else {
      if (DEBUG) console.log("json request");
      res.json({
        response: 'redirect',
        status: 302,
        message: 'this endpoint is not available for json requests',
        redirect: svrApi+"/"
      });
    }
  });
  app.get("/status", function(req, res) {
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(svrApi+'/status');
    } else {
      if (DEBUG) console.log("json request");
      res.json({
        response: 'redirect',
        status: 302,
        message: 'this endpoint is not available for json requests',
        redirect: svrApi+"/status"
      });
    }
  });
  app.get("/endpoints", function(req, res) {
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(svrApi+'/endpoints');
    } else {
      if (DEBUG) console.log("json request");
      res.json({
        response: 'redirect',
        status: 302,
        message: 'this endpoint is not available for json requests',
        redirect: svrApi+"/endpoints"
      });
    }
  });

  /*
   *      PLAYER ROUTES FOR REDIRECTION
   */
  app.get("/player", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(playerApi+"/player/info");
    } else {
      if (DEBUG) console.log("json request");
      res.json({
        response: 'unavailable',
        status: 415,
        message: 'this endpoint is not available for json requests',
        redirect: playerApi+"/player/info"
      });
    }
  });
  app.get("/player/info", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(playerApi+"/player/info");
    } else {
      if (DEBUG) console.log("json request");
      res.json({
        response: 'redirect',
        status: 302,
        message: 'this endpoint is not available for json requests',
        redirect: playerApi+"/player/info"
      });
    }
  });
  app.get("/player/demo", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(playerApi+"/player/demo");
    } else {
      if (DEBUG) console.log("json request");
      res.json({
        response: 'redirect',
        status: 302,
        message: 'this endpoint is not available for json requests',
        redirect: playerApi+"/player/demo"
      });
    }
  });
  app.get("/player/endpoints", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(playerApi+"/player/endpoints");
    } else {
      if (DEBUG) console.log("json request");
      res.json({
        response: 'redirect',
        status: 302,
        message: 'this endpoint is not available for json requests',
        redirect: playerApi+"/player/endpoints"
      });
    }
  });


  /*
   *      TAG DB SERVICE ROUTES FOR REDIRECTION
   */
  app.get("/tags", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(tagDbServiceApi+"/tags");
    } else {
      if (DEBUG) console.log("json request");
      res.json({
        response: 'redirect',
        status: 302,
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
      res.status(302).redirect(tagDbServiceApi+"/tags/tag/:id");
    } else {
      if (DEBUG) console.log("json request");
      res.json({
        response: 'redirect',
        status: 302,
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
      res.status(302).redirect(tagDbServiceApi+"/tags/tag/create");
    } else {
      if (DEBUG) console.log("json request");
      res.json({
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
      res.status(302).redirect(tagDbServiceApi+"/tags/info");
    } else {
      if (DEBUG) console.log("json request");
      res.json({
        response: 'redirect',
        status: 302,
        message: 'this endpoint is not available for json requests',
        redirect: tagDbServiceApi+"/tags/info"
      });
    }
  });
  app.get("/tags/endpoints", function(req, res){
   // the server checks whether the client accepts html (browser) or
   // json machine to machine communication
   var acceptsHTML = req.accepts('html');
   var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
   res.status(302).redirect(tagDbServiceApi+"/endpoints");
  } else {
    if (DEBUG) console.log("json request");
    res.json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: tagDbServiceApi+"/tags/endpoints"
    });
  }
  });
}

module.exports = appRouter;
