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

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

var nfcRouter = function(app) {
  // redirects
  app.get("/nfc", function(req, res) {
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(nfcReaderApi+'/nfc');
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: nfcReaderApi+'/nfc'
        });
    }
  });
  app.get("/endpoints", function(req, res) {
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(nfcReaderApi+'/endpoints');
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: nfcReaderApi+'/endpoints'
        });
    }
  });
}

module.exports = nfcRouter;
