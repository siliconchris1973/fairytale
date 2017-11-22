/*
 * This routing file only contains redirects
 * and the definition of endpoints. The concrete
 * endpoints are defined below
 *    /api/v1/[app|nfc|player|tags]
 * in each index.js and corresponding function files.
 */

const routes = require('express').Router();

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
const playerInfoUri = config.playerEndpoint.InfoUri;
const playerStatusUri = config.playerEndpoint.StatusUri;
const playerEndpointsUri = config.playerEndpoint.EndpointsUri;
const playerDescription = config.playerEndpoint.Description;
const playerFullUrl = playerProtocol+'://'+playerHost+':'+playerPort+playerApi+playerUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

// define routing endpoints based on directory structure
// in each sub directory defined here, you will find and
// index.js file that defines endpoints and sourceds in
// corresponding files with the actual endpoint functionality
const player = require('./api/v1/player');
routes.use('/api/v1/player', player);

/*
 *      PLAYER ROUTES FOR REDIRECTION
 */
routes.get("/", function(req, res){
 if (DEBUG) console.log("GET::/");
 // the server checks whether the client accepts html (browser) or
 // json machine to machine communication
 var acceptsHTML = req.accepts('html');
 var acceptsJSON = req.accepts('json');

 if (acceptsHTML) {
   if (TRACE) console.log('   redirecting to '+playerFullUrl+'/welcome');
   res.status(302).redirect(playerFullUrl+'/welcome');
 } else {
   res.status(302).json({
     response: 'redirect',
     status: 302,
     message: 'this endpoint is not available for json requests',
     redirect: playerFullUrl
   });
 }
});
routes.get("/player", function(req, res){
  if (DEBUG) console.log("GET::/player");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+playerFullUrl+'/welcome');
    res.status(302).redirect(playerFullUrl+"/welcome");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: playerFullUrl
    });
  }
});
routes.get("/player/help", function(req, res){
  if (DEBUG) console.log("GET::/player/help");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+playerFullUrl+'/help');
    res.status(302).redirect(playerFullUrl+"/help");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: playerFullUrl+'/help'
    });
  }
});
routes.get("/player/health", function(req, res){
  if (DEBUG) console.log("GET::/player/health");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+playerFullUrl+'/health');
    res.status(302).redirect(playerFullUrl+"/health");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: playerFullUrl+'/health'
    });
  }
});
routes.get("/player/info", function(req, res){
  if (DEBUG) console.log("GET::/player/info");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+playerFullUrl+'/info');
    res.status(302).redirect(playerFullUrl+"/info");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: playerFullUrl+'/info'
    });
  }
});
routes.get("/player/status", function(req, res){
  if (DEBUG) console.log("GET::/player/status");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+playerFullUrl+'/status');
    res.status(302).redirect(playerFullUrl+"/status");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: playerFullUrl+'/status'
    });
  }
});
routes.get("/player/endpoints", function(req, res){
  if (DEBUG) console.log("GET::/player/endpoints");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+playerFullUrl+'/endpoints');
    res.status(302).redirect(playerFullUrl+"/endpoints");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: playerFullUrl+'/endpoints'
    });
  }
});
routes.get("/player/welcome", function(req, res){
  if (DEBUG) console.log("GET::/player/welcome");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+playerFullUrl+'/welcome');
    res.status(302).redirect(playerFullUrl+"/welcome");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: playerFullUrl+'/welcome'
    });
  }
});
module.exports = routes;
