const playerRoutes = require('express').Router();

var config = require('../../../../modules/configuration.js');
var playerController = require('../../../../controller/playerController.js');

// CONFIG data on the RFID/NFC Reader Service
const playerAppName = config.playerEndpoint.AppName;
const playerProtocol = config.playerEndpoint.Protocol;
const playerHost = config.playerEndpoint.Host;
const playerPort = Number(config.playerEndpoint.Port);
const playerApi = config.playerEndpoint.Api;
const playerUrl = config.playerEndpoint.Url;
const playerHealthUri = config.playerEndpoint.HealthUri;
const playerHelpUri = config.playerEndpoint.HelpUri;
const playerDescription = config.playerEndpoint.Description;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

// Status entry for Player API
playerRoutes.get("/status", (req, res) => {
  if (DEBUG) console.log('GET::'+playerApi+playerUrl+'/status');

  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  // holds the response data to be send as either html or json
  var responseContent = "";
  if (acceptsHTML) {
    if (TRACE) console.log("   html request");
    res.status(200).render('tags', {
      title: 'Player Statusseite',
      headline: 'Player Statusseite',
      subheadline: 'Willkommen',
      messagetext: 'Hier&uuml;ber kannst Du den Status des Players abfragen',
    });
  } else {
    if (TRACE) console.log("   json request");
    res.status(200).json({ message: 'STATUS!' });
  }
});

module.exports = playerRoutes;
