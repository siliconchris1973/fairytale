/*
 * This routing file only contains redirects
 * and the definition of endpoints. The concrete
 * endpoints are defined below
 *    /api/v1/[app|nfc|led|tags]
 * in each index.js and corresponding function files.
 */

const routes = require('express').Router();

var config = require('../modules/configuration.js');

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
const tagDbServiceFullUrl = tagDbServiceProtocol+'://'+tagDbServiceHost+':'+tagDbServicePort+tagDbServiceApi+tagDbServiceUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

// define routing endpoints based on directory structure
// in each sub directory defined here, you will find and
// index.js file that defines endpoints and sourceds in
// corresponding files with the actual endpoint functionality
const tags = require('.'+tagDbServiceApi+tagDbServiceUrl);
routes.use(tagDbServiceApi+tagDbServiceUrl, tags);

/*
 *      TAG DB SERVICE ROUTES FOR REDIRECTION
 */
 routes.get("/", function(req, res){
   if (DEBUG) console.log("GET::/");
   // the server checks whether the client accepts html (browser) or
   // json machine to machine communication
   var acceptsHTML = req.accepts('html');
   var acceptsJSON = req.accepts('json');

   if (acceptsHTML) {
     if (TRACE) console.log('   redirecting to '+tagDbServiceFullUrl);
     res.status(302).redirect(tagDbServiceFullUrl);
   } else {
     res.json({
       response: 'redirect',
       status: 302,
       message: 'this endpoint is not available for json requests',
       redirect: tagDbServiceFullUrl
     });
   }
 });
routes.get("/tags", function(req, res){
  if (DEBUG) console.log("GET::/tags");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+tagDbServiceFullUrl);
    res.status(302).redirect(tagDbServiceFullUrl);
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: tagDbServiceFullUrl
    });
  }
});
routes.get("/tags/tag/:id", function(req, res){
  if (DEBUG) console.log("GET::/tags/tag/:id");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  // normally this endpoint needs an id given as part of the url
  var id = 0;
  // if there is such an id, we put it in a var to make the reidrect complete
  if (req.params.id) id = req.params.id

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+tagDbServiceFullUrl+'/tag'+id);
    res.status(302).redirect(tagDbServiceFullUrl+'/tag/'+id);
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: tagDbServiceFullUrl+'/tag/'+id
    });
  }
});
routes.get("/tags/tag/create", function(req, res){
  if (DEBUG) console.log("GET::/tags/tag/create");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+tagDbServiceFullUrl+'/tag/create');
    res.status(302).redirect(tagDbServiceFullUrl+'/tag/create');
  } else {
    res.json({
      response: 'unavailable',
      status: 415,
      message: 'this endpoint is not available for json requests',
      redirect: tagDbServiceFullUrl+'/tag'
    });
  }
});
routes.get("/tags/info", function(req, res){
  if (DEBUG) console.log("GET::/tags/info");
 // the server checks whether the client accepts html (browser) or
 // json machine to machine communication
 var acceptsHTML = req.accepts('html');
 var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+tagDbServiceFullUrl+'/info');
    res.status(302).redirect(tagDbServiceFullUrl+'/info');
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: tagDbServiceFullUrl+'/info'
    });
  }
});
routes.get("/tags/endpoints", function(req, res){
  if (DEBUG) console.log("GET::/tags/endpoints");
 // the server checks whether the client accepts html (browser) or
 // json machine to machine communication
 var acceptsHTML = req.accepts('html');
 var acceptsJSON = req.accepts('json');

if (acceptsHTML) {
  if (TRACE) console.log('   redirecting to '+tagDbServiceFullUrl+'/endpoints');
 res.status(302).redirect(tagDbServiceFullUrl+'/endpoints');
} else {
  res.json({
    response: 'redirect',
    status: 302,
    message: 'this endpoint is not available for json requests',
    redirect: tagDbServiceFullUrl+'/endpoints'
  });
}
});
routes.get("/tags/status", function(req, res){
  if (DEBUG) console.log("GET::/tags/status");
 // the server checks whether the client accepts html (browser) or
 // json machine to machine communication
 var acceptsHTML = req.accepts('html');
 var acceptsJSON = req.accepts('json');

if (acceptsHTML) {
  if (TRACE) console.log('   redirecting to '+tagDbServiceFullUrl+'/status');
 res.status(302).redirect(tagDbServiceFullUrl+'/status');
} else {
  res.json({
    response: 'redirect',
    status: 302,
    message: 'this endpoint is not available for json requests',
    redirect: tagDbServiceFullUrl+'/status'
  });
}
});

module.exports = routes;
