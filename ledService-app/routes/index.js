/*
 * This routing file only contains redirects
 * and the definition of endpoints. The concrete
 * endpoints are defined below
 *    /api/v1/[app|nfc|led|tags]
 * in each index.js and corresponding function files.
 */

const routes = require('express').Router();

var config = require('../modules/configuration.js');

// CONFIG data on the LED Controller
const ledServiceAppName = config.ledServiceEndpoint.AppName;
const ledServiceProtocol = config.ledServiceEndpoint.Protocol;
const ledServiceHost = config.ledServiceEndpoint.Host;
const ledServicePort = Number(config.ledServiceEndpoint.Port);
const ledServiceApi = config.ledServiceEndpoint.Api;
const ledServiceUrl = config.ledServiceEndpoint.Url;
const ledServiceHealthUri = config.ledServiceEndpoint.HealthUri;
const ledServiceHelpUri = config.ledServiceEndpoint.HelpUri;
const ledServiceDescription = config.ledServiceEndpoint.Description;
const ledServiceFullUrl = ledServiceProtocol+'://'+ledServiceHost+':'+ledServicePort+ledServiceApi+ledServiceUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

// define routing endpoints based on directory structure
// in each sub directory defined here, you will find and
// index.js file that defines endpoints and sourceds in
// corresponding files with the actual endpoint functionality
const led = require('./api/v1/led');
routes.use('/api/v1/led', led);

/*
 *      LED CONTROLLER ROUTES FOR REDIRECTION
 */
routes.get("/led", function(req, res){
  if (DEBUG) console.log("GET::/led");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+ledServiceFullUrl+'/info');
    res.status(302).redirect(ledServiceFullUrl+"/info");
  } else {
    res.json({
      response: 'unavailable',
      status: 415,
      message: 'this endpoint is not available for json requests',
      redirect: ledServiceFullUrl
    });
  }
});
routes.get("/led/info", function(req, res){
  if (DEBUG) console.log("GET::/led/info");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+ledServiceFullUrl+'/info');
    res.status(302).redirect(ledServiceFullUrl+"/info");
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: ledServiceFullUrl+'/info'
    });
  }
});
routes.get("/led/status", function(req, res){
  if (DEBUG) console.log("GET::/led/status");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+ledServiceFullUrl+'/status');
    res.status(302).redirect(ledServiceFullUrl+"/status");
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: ledServiceFullUrl+'/status'
    });
  }
});
routes.get("/led/endpoints", function(req, res){
  if (DEBUG) console.log("GET::/led/endpoints");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+ledServiceFullUrl+'/endpoints');
    res.status(302).redirect(ledServiceFullUrl+"/endpoints");
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: ledServiceFullUrl+'/endpoints'
    });
  }
});

module.exports = routes;
