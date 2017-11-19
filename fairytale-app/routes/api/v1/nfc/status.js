const nfcRoutes = require('express').Router();

var config = require('../../../../modules/configuration.js');
var appController = require('../../../../controller/appController.js');

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

// welcome entry for NFC Reader API
nfcRoutes.get("/status", (req, res) => {
  if (DEBUG) console.log('GET::'+nfcReaderApi+nfcReaderUrl+'/status');

  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  // holds the response data to be send as either html or json
  var responseContent = "";
  if (acceptsHTML) {
    if (TRACE) console.log("   html request");
    res.status(200).render('tags', {
      title: 'NFC Reader Statusseite',
      headline: 'NFC Reader Statusseite',
      subheadline: 'Willkommen',
      messagetext: 'Hier&uuml;ber kannst Du den Status des NFC Reader abfragen',
    });
  } else {
    if (TRACE) console.log("   json request");
    res.status(200).json({ message: 'STATUS!' });
  }
});

module.exports = nfcRoutes;
