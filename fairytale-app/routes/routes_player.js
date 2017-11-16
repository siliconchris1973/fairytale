var config = require('../modules/configuration.js');

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

var playerRouter = function(app) {
  // redirects
  app.get("/", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(playerApi+"/player/info");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'unavailable',
          status: 415,
          message: 'this endpoint is not available for json requests',
          redirect: playerApi+"/player/info"
        });
    }
  });
  app.get("/player", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(playerApi+"/player/info");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
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
      res.json(
        {
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
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: playerApi+"/player/demo"
        });
    }
  });
  app.get("/endpoints", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(playerApi+"/player/endpoints");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: playerApi+"/player/endpoints"
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
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: playerApi+"/player/endpoints"
        });
    }
  });
}

module.exports = playerRouter;
