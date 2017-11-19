const nfcRoutes = require('express').Router();

var config = require('../../../../modules/configuration.js');
var nfcController = require('../../../../controller/nfcController.js');

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

// endpoints entry for the NFC Reader API
nfcRoutes.get("/endpoints", (req, res) => {
  if (DEBUG) console.log('GET::'+nfcReaderApi+nfcReaderUrl+'/endpoints');
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');
  var obj = nfcController.getEndpoints();

  if (acceptsHTML) {
    if (TRACE) console.log("   html request");
    res.status(200).render('endpoints', {
        title: 'Welcome to Fairytale NFC Reader',
        headline: 'NFC Reader API Endpunkte',
        subheadline: 'Verf&uuml;gbare REST Endpunkte f&uuml;r den NFC Reader',
        messagetext: '&Uuml;ber die Navigation kannst Du die einzelnen Funktionen ausw&auml;hlen',
        varEndpoints: obj.endpoints
    });
  } else {
    if (TRACE) console.log("   json request");
    var respEndpoints = {
      message: 'REST API Endpoints available',
      endpoints: obj.endpoints
      };
    res.status(200).json(respEndpoints);
  }
});

module.exports = nfcRoutes;
