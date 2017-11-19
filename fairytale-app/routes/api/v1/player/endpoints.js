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

playerRoutes.get("/endpoints", (req, res) => {
  if (DEBUG) console.log('GET::'+playerApi+playerUrl+'/endpoints');
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');
  var obj = playerController.getEndpoints();

  if (acceptsHTML) {
    if (TRACE) console.log("   html request");

    res.status(200).render('endpoints', {
      title: 'Fairytale Player Endpoints',
      headline: 'Fairytale Player',
      subheadline: 'Endpunkte',
      messagetext: 'Endpunkt ausw&auml;hlen',
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

module.exports = playerRoutes;
