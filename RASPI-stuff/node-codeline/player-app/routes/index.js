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
const svrAppName = config.playerEndpoint.AppName;
const svrProtocol = config.playerEndpoint.Protocol;
const svrHost = config.playerEndpoint.Host;
const svrPort = Number(config.playerEndpoint.Port);
const svrApi = config.playerEndpoint.Api;
const svrUrl = config.playerEndpoint.Url;
const svrHealthUri = config.playerEndpoint.HealthUri;
const svrHelpUri = config.playerEndpoint.HelpUri;
const svrInfoUri = config.playerEndpoint.InfoUri;
const svrStatusUri = config.playerEndpoint.StatusUri;
const svrEndpointsUri = config.playerEndpoint.EndpointsUri;
const svrDescription = config.playerEndpoint.Description;
const svrFullUrl = svrProtocol+'://'+svrHost+':'+svrPort+svrApi+svrUrl;

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
   if (TRACE) console.log('   redirecting to '+svrFullUrl+'/welcome');
   res.status(302).redirect(svrFullUrl+'/welcome');
 } else {
   res.status(302).json({
     response: 'redirect',
     status: 302,
     status_text: '302 - redirect',
     message: 'this endpoint is not available for json requests',
     redirect: svrFullUrl
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
    if (TRACE) console.log('   redirecting to '+svrFullUrl+'/welcome');
    res.status(302).redirect(svrFullUrl+"/welcome");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      status_text: '302 - redirect',
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl
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
    if (TRACE) console.log('   redirecting to '+svrFullUrl+'/help');
    res.status(302).redirect(svrFullUrl+"/help");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      status_text: '302 - redirect',
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl+'/help'
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
    if (TRACE) console.log('   redirecting to '+svrFullUrl+'/health');
    res.status(302).redirect(svrFullUrl+"/health");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      status_text: '302 - redirect',
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl+'/health'
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
    if (TRACE) console.log('   redirecting to '+svrFullUrl+'/info');
    res.status(302).redirect(svrFullUrl+"/info");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      status_text: '302 - redirect',
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl+'/info'
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
    if (TRACE) console.log('   redirecting to '+svrFullUrl+'/status');
    res.status(302).redirect(svrFullUrl+"/status");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      status_text: '302 - redirect',
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl+'/status'
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
    if (TRACE) console.log('   redirecting to '+svrFullUrl+'/endpoints');
    res.status(302).redirect(svrFullUrl+"/endpoints");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      status_text: '302 - redirect',
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl+'/endpoints'
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
    if (TRACE) console.log('   redirecting to '+svrFullUrl+'/welcome');
    res.status(302).redirect(svrFullUrl+"/welcome");
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      status_text: '302 - redirect',
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl+'/welcome'
    });
  }
});
module.exports = routes;
