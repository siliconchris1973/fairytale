/*
 * This routing file only contains redirects
 * and the definition of endpoints. The concrete
 * endpoints are defined below
 *    /api/v1/[app|nfc|led|tags]
 * in each index.js and corresponding function files.
 */

const routes = require('express').Router();

var config = require('../modules/configuration.js');

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

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

// define routing endpoints based on directory structure
// in each sub directory defined here, you will find and
// index.js file that defines endpoints and sourceds in
// corresponding files with the actual endpoint functionality
const nfc = require('./api/v1/nfc');
routes.use('/api/v1/nfc', nfc);

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
  if (DEBUG) console.log("GET::/led/info");
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

module.exports = routes;
