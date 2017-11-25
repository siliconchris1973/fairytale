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
const svrAppName = config.tagDbServiceEndpoint.AppName;
const svrProtocol = config.tagDbServiceEndpoint.Protocol;
const svrHost = config.tagDbServiceEndpoint.Host;
const svrPort = Number(config.tagDbServiceEndpoint.Port);
const svrApi = config.tagDbServiceEndpoint.Api;
const svrUrl = config.tagDbServiceEndpoint.Url;
const svrHealthUri = config.tagDbServiceEndpoint.HealthUri;
const svrHelpUri = config.tagDbServiceEndpoint.HelpUri;
const svrDescription = config.tagDbServiceEndpoint.Description;
const svrInfoUri = config.tagDbServiceEndpoint.InfoUri;
const svrWelcomeUri = config.tagDbServiceEndpoint.WelcomeUri;
const svrStatusUri = config.tagDbServiceEndpoint.StatusUri;
const svrEndpointsUri = config.tagDbServiceEndpoint.EndpointsUri;
const svrFullUrl = svrProtocol+'://'+svrHost+':'+svrPort+svrApi+svrUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

// define routing endpoints based on directory structure
// in each sub directory defined here, you will find and
// index.js file that defines endpoints and sourceds in
// corresponding files with the actual endpoint functionality
const tags = require('./api/v1/tags');
routes.use('/api/v1/tags', tags);

/*
 *      TAG DB SERVICE ROUTES FOR REDIRECTION
 */
 routes.get("/", (req, res) => {
   if (DEBUG) console.log("GET::/");
   // the server checks whether the client accepts html (browser) or
   // json machine to machine communication
   var acceptsHTML = req.accepts('html');
   var acceptsJSON = req.accepts('json');

   if (acceptsHTML) {
     if (TRACE) console.log('   redirecting to '+svrFullUrl);
     res.status(302).redirect(svrFullUrl);
   } else {
     res.json({
       response: 'redirect',
       status: 302,
       status_text: '302 - redirect',
       message: 'this endpoint is not available for json requests',
       redirect: svrFullUrl
     });
   }
 });
routes.get("/tags", (req, res) => {
  if (DEBUG) console.log("GET::/tags");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+svrFullUrl);
    res.status(302).redirect(svrFullUrl);
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      status_text: '302 - redirect',
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl
    });
  }
});
routes.get("/tags/tag/:id", (req, res) => {
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
    if (TRACE) console.log('   redirecting to '+svrFullUrl+'/tag'+id);
    res.status(302).redirect(svrFullUrl+'/tag/'+id);
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      status_text: '302 - redirect',
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl+'/tag/'+id
    });
  }
});
routes.get("/tags/tag/create", (req, res) => {
  if (DEBUG) console.log("GET::/tags/tag/create");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+svrFullUrl+'/tag/create');
    res.status(302).redirect(svrFullUrl+'/tag/create');
  } else {
    res.json({
      response: 'unavailable',
      status: 415,
      status_text: '415 - unavailable',
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl+'/tag'
    });
  }
});
routes.get("/tags/info", (req, res) => {
  if (DEBUG) console.log("GET::/tags/info");
 // the server checks whether the client accepts html (browser) or
 // json machine to machine communication
 var acceptsHTML = req.accepts('html');
 var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+svrFullUrl+'/info');
    res.status(302).redirect(svrFullUrl+'/info');
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      status_text: '302 - redirect',
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl+'/info'
    });
  }
});
routes.get("/tags/endpoints", (req, res) => {
  if (DEBUG) console.log("GET::/tags/endpoints");
 // the server checks whether the client accepts html (browser) or
 // json machine to machine communication
 var acceptsHTML = req.accepts('html');
 var acceptsJSON = req.accepts('json');

if (acceptsHTML) {
  if (TRACE) console.log('   redirecting to '+svrFullUrl+'/endpoints');
 res.status(302).redirect(svrFullUrl+'/endpoints');
} else {
  res.json({
    response: 'redirect',
    status: 302,
    status_text: '302 - redirect',
    message: 'this endpoint is not available for json requests',
    redirect: svrFullUrl+'/endpoints'
  });
}
});
routes.get("/tags/status", (req, res) => {
  if (DEBUG) console.log("GET::/tags/status");
 // the server checks whether the client accepts html (browser) or
 // json machine to machine communication
 var acceptsHTML = req.accepts('html');
 var acceptsJSON = req.accepts('json');

if (acceptsHTML) {
  if (TRACE) console.log('   redirecting to '+svrFullUrl+'/status');
 res.status(302).redirect(svrFullUrl+'/status');
} else {
  res.json({
    response: 'redirect',
    status: 302,
    status_text: '302 - redirect',
    message: 'this endpoint is not available for json requests',
    redirect: svrFullUrl+'/status'
  });
}
});

module.exports = routes;
