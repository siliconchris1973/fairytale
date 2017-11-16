var config = require('../modules/configuration.js');

// CONFIG data on the RFID/NFC Reader Service
const rfidReaderAppName = config.rfidReaderEndpoint.AppName;
const rfidReaderProtocol = config.rfidReaderEndpoint.Protocol;
const rfidReaderHost = config.rfidReaderEndpoint.Host;
const rfidReaderPort = Number(config.rfidReaderEndpoint.Port);
const rfidReaderApi = config.rfidReaderEndpoint.Api;
const rfidReaderUrl = config.rfidReaderEndpoint.Url;
const rfidReaderHealthUri = config.rfidReaderEndpoint.HealthUri;
const rfidReaderHelpUri = config.rfidReaderEndpoint.HelpUri;
const rfidReaderDescription = config.rfidReaderEndpoint.Description;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

var rfidRouter = function(app) {
  // redirects
  app.get("/rfid", function(req, res) {
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(rfidReaderApi+'/rfid');
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: rfidReaderApi+'/rfid'
        });
    }
  });
  app.get("/endpoints", function(req, res) {
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(rfidReaderApi+'/endpoints');
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: rfidReaderApi+'/endpoints'
        });
    }
  });
}

module.exports = rfidRouter;
