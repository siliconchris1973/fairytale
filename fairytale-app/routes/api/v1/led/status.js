const ledRoutes = require('express').Router();

var config = require('../../../../modules/configuration.js');
var ledController = require('../../../../controller/ledController.js');

// CONFIG data on the led
const ledAppName = config.ledServiceEndpoint.AppName;
const ledProtocol = config.ledServiceEndpoint.Protocol;
const ledHost = config.ledServiceEndpoint.Host;
const ledPort = Number(config.ledServiceEndpoint.Port);
const ledApi = config.ledServiceEndpoint.Api;
const ledUrl = config.ledServiceEndpoint.Url;
const ledHealthUri = config.ledServiceEndpoint.HealthUri;
const ledHelpUri = config.ledServiceEndpoint.HelpUri;
const ledDescription = config.ledServiceEndpoint.Description;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

ledRoutes.get('/status', (req, res) => {
  if (DEBUG) console.log('GET::'+ledApi+ledUrl+'/status');
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');
  
  if (acceptsHTML) {
    if (TRACE) console.log("html request");

    res.status(200).render('component_status', {
        title: 'LED Controller Statusseite',
        headline: 'LED Controller',
        subheadline: 'Willkommen',
        messagetext: 'THIS PAGE IS A PLACEHOLDER - COMPONENT STATUS TO COME LATER'
    });
  } else {
    if (TRACE) console.log("json request");
    res.status(200).json({ message: 'STATUS!' });
  }
});

module.exports = ledRoutes;
