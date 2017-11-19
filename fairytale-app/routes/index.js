/*
 * This routing file only contains redirects
 * and the definition of endpoints. The concrete
 * endpoints are defined below
 *    /api/v1/[app|nfc|player|tags]
 * in each index.js and corresponding function files.
 */

const routes = require('express').Router();

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
const svrFullUrl = svrProtocol+'://'+svrHost+':'+svrPort+svrApi+svrUrl;

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
const fileServiceFullUrl = fileServiceProtocol+'://'+fileServiceHost+':'+fileServicePort+fileServiceApi+fileServiceUrl;

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
const nfcReaderFullUrl = nfcReaderProtocol+'://'+nfcReaderHost+':'+nfcReaderPort+nfcReaderApi+nfcReaderUrl;

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
const playerFullUrl = playerProtocol+'://'+playerHost+':'+playerPort+playerApi+playerUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

// define routing endpoints based on directory structure
// in each sub directory defined here, you will find and
// index.js file that defines endpoints and sourceds in
// corresponding files with the actual endpoint functionality
const app = require('./api/v1/app');
routes.use('/api/v1/app', app);
const tags = require('./api/v1/tags');
routes.use('/api/v1/tags', tags);
const nfc = require('./api/v1/nfc');
routes.use('/api/v1/nfc', nfc);
const player = require('./api/v1/player');
routes.use('/api/v1/player', player);

/*
 *       MAIN APP ROUTES FOR REDIRECTION
 */
routes.get("/", function(req, res) {
  if (DEBUG) console.log("GET::/");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+svrFullUrl);
    res.status(302).redirect(svrFullUrl+'/welcome');
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl+'/welcome'
    });
  }
});
routes.get("/status", function(req, res) {
  if (DEBUG) console.log("GET::/status");
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
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl+'/status'
    });
  }
});
routes.get("/endpoints", function(req, res) {
  if (DEBUG) console.log("GET::/endpoints");
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
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl+'/endpoints'
    });
  }
});


/*
 *      PLAYER ROUTES FOR REDIRECTION
 */
routes.get("/player", function(req, res){
  if (DEBUG) console.log("GET::/player");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+playerFullUrl+'/info');
    res.status(302).redirect(playerFullUrl+"/info");
  } else {
    res.json({
      response: 'unavailable',
      status: 415,
      message: 'this endpoint is not available for json requests',
      redirect: playerFullUrl
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
    res.json({
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
    res.json({
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
    res.json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: playerFullUrl+'/endpoints'
    });
  }
});


/*
 *      NFC READER ROUTES FOR REDIRECTION
 */
routes.get("/nfc", function(req, res){
  if (DEBUG) console.log("GET::/nfc");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+nfcReaderFullUrl+'/info');
    res.status(302).redirect(nfcReaderFullUrl+"/info");
  } else {
    res.json({
      response: 'unavailable',
      status: 415,
      message: 'this endpoint is not available for json requests',
      redirect: nfcReaderFullUrl
    });
  }
});
routes.get("/nfc/info", function(req, res){
  if (DEBUG) console.log("GET::/player/info");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+nfcReaderFullUrl+'/info');
    res.status(302).redirect(nfcReaderFullUrl+"/info");
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: nfcReaderFullUrl+'/info'
    });
  }
});
routes.get("/nfc/endpoints", function(req, res){
  if (DEBUG) console.log("GET::/nfc/endpoints");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+nfcReaderFullUrl+'/endpoints');
    res.status(302).redirect(nfcReaderFullUrl+"/endpoints");
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: nfcReaderFullUrl+'/endpoints'
    });
  }
});
routes.get("/nfc/status", function(req, res){
  if (DEBUG) console.log("GET::/nfc/status");
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+nfcReaderFullUrl+'/status');
    res.status(302).redirect(nfcReaderFullUrl+"/status");
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: nfcReaderFullUrl+'/status'
    });
  }
});

/*
 *      TAG DB SERVICE ROUTES FOR REDIRECTION
 */
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
