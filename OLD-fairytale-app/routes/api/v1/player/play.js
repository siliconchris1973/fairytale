const playerRoutes = require('express').Router();

var config = require('../../../../modules/configuration.js');
var playerController = require('../../../../controller/playerController.js');

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

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

// endpoints entry for the Player API
playerRoutes.get("/play/:id", (req, res) => {
  if (DEBUG) console.log('GET::'+playerApi+playerUrl+'/play');
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if(!req.params.id) {
    var responseJson = {
      response: 'Warning',
      message: 'No ID provided, so nothing to play',
      status: '400 - Bad Request',
      error: 'Missing ID'
    };

    console.warn(responseJson)

    if (acceptsHTML) {
      if (TRACE) console.log("   html request");
      res.status(400).render('player_error', responseJson);
    } else {
      if (TRACE) console.log("   json request");
      res.status(400).json(responseJson);
    }
  } else {
    // get all the necesary information on the album and the track to be played
    var tagId = req.params.id;

    // TODO add call to playerController
    //thePlayer.play(tagId);

    if (acceptsHTML) {
      if (TRACE) console.log("   html request");
      var respObj = responseJson;
      res.status(200).render('player_view', respObj);
    } else {
      if (TRACE) console.log("   json request");
      res.status(200).json(responseJson);
    }
  }
});

module.exports = playerRoutes;