const appRoutes = require('express').Router();

var config = require('../../../../modules/configuration.js');
var appController = require('../../../../controller/nfcReaderController.js');

// CONFIG data on the MP3 Player
const svrAppName = config.nfcReaderEndpoint.AppName;
const svrProtocol = config.nfcReaderEndpoint.Protocol;
const svrHost = config.nfcReaderEndpoint.Host;
const svrPort = Number(config.nfcReaderEndpoint.Port);
const svrApi = config.nfcReaderEndpoint.Api;
const svrUrl = config.nfcReaderEndpoint.Url;
const svrHealthUri = config.nfcReaderEndpoint.HealthUri;
const svrHelpUri = config.nfcReaderEndpoint.HelpUri;
const svrInfoUri = config.nfcReaderEndpoint.InfoUri;
const svrStatusUri = config.nfcReaderEndpoint.StatusUri;
const svrEndpointsUri = config.nfcReaderEndpoint.EndpointsUri;
const svrDescription = config.nfcReaderEndpoint.Description;
const svrFullUrl = svrProtocol+'://'+svrHost+':'+svrPort+svrApi+svrUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

// Status entry for Player API
appRoutes.get("/status", (req, res) => {
  if (DEBUG) console.log('GET::'+svrApi+svrUrl+'/status');

  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  // holds the response data to be send as either html or json
  var responseContent = "";
  if (acceptsHTML) {
    if (TRACE) console.log("   html request");
    res.status(200).render('status', {
      title: svrAppName + ' Status',
      headline: svrAppName,
      subheadline: 'Status',
      messagetext: 'Hier&uuml;ber kannst Du den Status abfragen',
    });
  } else {
    if (TRACE) console.log("   json request");
    res.status(200).json({ message: 'STATUS!' });
  }
});

module.exports = appRoutes;
