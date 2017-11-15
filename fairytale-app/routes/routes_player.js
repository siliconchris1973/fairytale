var path = require('path');
var fs = require('fs');
var http = require('http');

var config = require('../modules/configuration.js');

// CONFIG data on the app
const svrAppName = config.appEndpoint.AppName;
const svrProtocol = config.appEndpoint.Protocol;
const svrHost = config.appEndpoint.Host;
const svrPort = Number(config.appEndpoint.Port);
const svrApi = config.appEndpoint.Api;
const svrUrl = config.appEndpoint.Url;
const svrHealthUri = config.appEndpoint.HealthUri;
const svrDescription = config.appEndpoint.Description;

// CONFIG data on the file Upload Service
const fileServiceAppName = config.fileServiceEndpoint.AppName;
const fileServiceProtocol = config.fileServiceEndpoint.Protocol;
const fileServiceHost = config.fileServiceEndpoint.Host;
const fileServicePort = Number(config.fileServiceEndpoint.Port);
const fileServiceApi = config.fileServiceEndpoint.Api;
const fileServiceUrl = config.fileServiceEndpoint.Url;
const fileServiceHealthUri = config.fileServiceEndpoint.HealthUri;
const fileServiceDescription = config.fileServiceEndpoint.Description;

// CONFIG data on the RFID/NFC Reader Service
const rfidReaderAppName = config.rfidReaderEndpoint.AppName;
const rfidReaderProtocol = config.rfidReaderEndpoint.Protocol;
const rfidReaderHost = config.rfidReaderEndpoint.Host;
const rfidReaderPort = Number(config.rfidReaderEndpoint.Port);
const rfidReaderApi = config.rfidReaderEndpoint.Api;
const rfidReaderUrl = config.rfidReaderEndpoint.Url;
const rfidReaderHealthUri = config.rfidReaderEndpoint.HealthUri;
const rfidReaderDescription = config.rfidReaderEndpoint.Description;

// CONFIG data on the RFID/NFC Tag DB Service
const tagDbServiceAppName = config.tagDbServiceEndpoint.AppName;
const tagDbServiceProtocol = config.tagDbServiceEndpoint.Protocol;
const tagDbServiceHost = config.tagDbServiceEndpoint.Host;
const tagDbServicePort = Number(config.tagDbServiceEndpoint.Port);
const tagDbServiceApi = config.tagDbServiceEndpoint.Api;
const tagDbServiceUrl = config.tagDbServiceEndpoint.Url;
const tagDbServiceHealthUri = config.tagDbServiceEndpoint.HealthUri;
const tagDbServiceDescription = config.tagDbServiceEndpoint.Description;

// CONFIG data on the MP3 Player
const playerAppName = config.playerEndpoint.AppName;
const playerProtocol = config.playerEndpoint.Protocol;
const playerHost = config.playerEndpoint.Host;
const playerPort = Number(config.playerEndpoint.Port);
const playerApi = config.playerEndpoint.Api;
const playerUrl = config.playerEndpoint.Url;
const playerHealthUri = config.playerEndpoint.HealthUri;
const playerDescription = config.playerEndpoint.Description;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

const soundDir = config.directories.SoundDir;
const mediaDir = config.directories.MediaDir;
const tagDB = config.directories.TagDB;

var playerController = require('../controller/playerController.js');

var playerRouter = function(plr) {

  const playerEndpoints = {
    endpoints: [
      {
        shortcut: 'info',
        endpoint: playerProtocol + '://' + playerHost+':'+playerPort+playerApi+playerUrl+'/info',
        description: 'the root entry of the mp3 player API',
        alive: 'true'
      },
      {
        shortcut: 'play',
        endpoint: playerProtocol + '://' + playerHost+':'+playerPort+playerApi+playerUrl+'/:id/play',
        description: 'play a given mp3 file',
        alive: 'true'
      },
      {
        shortcut: 'stop',
        endpoint: playerProtocol + '://' + playerHost+':'+playerPort+playerApi+playerUrl+'/:id/stop',
        description: 'stop playing',
        alive: 'true'
      },
      {
        shortcut: 'pause',
        endpoint: playerProtocol + '://' + playerHost+':'+playerPort+playerApi+playerUrl+'/:id/pause',
        description: 'pause playback',
        alive: 'true'
      },
      {
        shortcut: 'skip',
        endpoint: playerProtocol + '://' + playerHost+':'+playerPort+playerApi+playerUrl+'/:id/skip',
        description: 'skip 10 seconds of played file',
        alive: 'false'
      },
      {
        shortcut: 'forward',
        endpoint: playerProtocol + '://' + playerHost+':'+playerPort+playerApi+playerUrl+'/:id/forward',
        description: 'fast forward in current file',
        alive: 'false'
      },
      {
        shortcut: 'rewind',
        endpoint: playerProtocol + '://' + playerHost+':'+playerPort+playerApi+playerUrl+'/:id/rewind',
        description: 'rewind in current file',
        alive: 'false'
      },
      {
        shortcut: 'next',
        endpoint: playerProtocol + '://' + playerHost+':'+playerPort+playerApi+playerUrl+'/:id/next',
        description: 'jump to next file for currently played album',
        alive: 'false'
      },
      {
        shortcut: 'prev',
        endpoint: playerProtocol + '://' + playerHost+':'+playerPort+playerApi+playerUrl+'/:id/prev',
        description: 'jump to previous file of currently played album',
        alive: 'false'
      }
    ]
  };


  // redirects
  plr.get("/", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.redirect(playerApi+"/player/info");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'unavailable',
          status: 415,
          message: 'this endpoint is not available for json requests',
          redirect: playerApi+"/player/info"
        });
    }
  });
  plr.get("/player", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.redirect(playerApi+"/player/info");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'unavailable',
          status: 415,
          message: 'this endpoint is not available for json requests',
          redirect: playerApi+"/player/info"
        });
    }
    res.redirect(playerApi+"/player");
  });
  plr.get(playerApi+"/player", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.redirect(playerApi+"/player/info");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'unavailable',
          status: 415,
          message: 'this endpoint is not available for json requests',
          redirect: playerApi+"/player"
        });
    }
  });
  plr.get("/player/info", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.redirect(playerApi+"/player/info");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'unavailable',
          status: 415,
          message: 'this endpoint is not available for json requests',
          redirect: playerApi+"/player/info"
        });
    }
  });
  plr.get("/player/demo", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.redirect(playerApi+"/player/demo");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'unavailable',
          status: 415,
          message: 'this endpoint is not available for json requests',
          redirect: playerApi+"/player/demo"
        });
    }
  });


  // the player
  plr.get(playerApi+"/player/info", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/info");
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');
    var obj = playerEndpoints;

    var responseJson = {
      headline: 'MP3 Player API Infoseite',
      subheadline: 'API Endpunkte',
      messagetext: 'Folgende Endpunkte sind über die API des Players erreichbar',
      endpoints: obj.endpoints
    };

    res.setHeader('X-Powered-By', 'bacon');

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      var endObj = responseJson;
      res.render('player_nav', endObj);
    } else {
      if (DEBUG) console.log("json request");
      res.json(playerEndpoints);
    }
  });


  plr.get(playerApi+"/player/:id/play", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/play");

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

      res.statusCode = 400;
      if (acceptsHTML) {
        res.render('player_error', responseJson);
      } else {
        res.json(responseJson);
      }
    } else {
      // get all the necesary information on the album and the track to be played
      var tagId = req.params.id;

      // TODO add call to playerController
      //thePlayer.play(plr, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });

  plr.get(playerApi+"/player/:id/stop", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/stop");
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.params.id) {
      var responseJson = {
        response: 'Warning',
        message: 'No ID provided, so nothing to stop',
        status: '400 - Bad Request',
        error: 'Missing ID'
      };

      console.warn(responseJson)

      res.statusCode = 400;
      if (acceptsHTML) {
        res.render('player_error', responseJson);
      } else {
        res.json(responseJson);
      }
    } else {
      var tagId = req.params.id;

      // TODO call playerController to stop playback
      //thePlayer.stop(plr, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });


  // TODO player PAUSE
  plr.get(playerApi+"/player/:id/pause", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/pause");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.params.id) {
      var responseJson = {
        response: 'Warning',
        message: 'No ID provided, so nothing to pause',
        status: '400 - Bad Request',
        error: 'Missing ID'
      };

      console.warn(responseJson)

      res.statusCode = 400;
      if (acceptsHTML) {
        res.render('player_error', responseJson);
      } else {
        res.json(responseJson);
      }
    } else {
      var tagId = req.params.id;

      // TODO call playerController to pause playback
      //thePlayer.pause(plr, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });

  // TODO play next file of current album
  plr.get(playerApi+"/player/:id/next", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/next");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.params.id) {
      var responseJson = {
        response: 'Warning',
        message: 'No ID provided, can\'t play next file',
        status: '400 - Bad Request',
        error: 'Missing ID'
      };

      console.warn(responseJson)

      res.statusCode = 400;
      if (acceptsHTML) {
        res.render('player_error', responseJson);
      } else {
        res.json(responseJson);
      }
    } else {
      var tagId = req.params.id;

      // TODO call playerController to play next
      //thePlayer.next(plr, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });


  // TODO play prev file of current album
  plr.get(playerApi+"/player/:id/prev", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/prev");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.params.id) {
      var responseJson = {
        response: 'Warning',
        message: 'No ID provided, can\'t play previos file',
        status: '400 - Bad Request',
        error: 'Missing ID'
      };

      console.warn(responseJson)

      res.statusCode = 400;
      if (acceptsHTML) {
        res.render('player_error', responseJson);
      } else {
        res.json(responseJson);
      }
    } else {
      var tagId = req.params.id;

      // TODO call playerController to play previos file
      //thePlayer.prev(plr, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });


  // TODO All these do not work currently, as the player is not updating it's position
  plr.get(playerApi+"/player/:id/skip", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/skip");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.params.id) {
      var responseJson = {
        response: 'Warning',
        message: 'No ID provided, can\'t skip in unknown file',
        status: '400 - Bad Request',
        error: 'Missing ID'
      };

      console.warn(responseJson)

      res.statusCode = 400;
      if (acceptsHTML) {
        res.render('player_error', responseJson);
      } else {
        res.json(responseJson);
      }
    } else {
      var tagId = req.params.id;

      // TODO call playerController to skip in file
      //thePlayer.skip(plr, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });

  plr.get(playerApi+"/player/:id/forward", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/forward");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.params.id) {
      var responseJson = {
        response: 'Warning',
        message: 'No ID provided, can\'t fast forward in unknown file',
        status: '400 - Bad Request',
        error: 'Missing ID'
      };

      console.warn(responseJson)

      res.statusCode = 400;
      if (acceptsHTML) {
        res.render('player_error', responseJson);
      } else {
        res.json(responseJson);
      }
    } else {
      var tagId = req.params.id;

      // TODO call playerController to fast forward
      //thePlayer.forward(plr, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });

  plr.get(playerApi+"/player/:id/rewind", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/rewind");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.params.id) {
      var responseJson = {
        response: 'Warning',
        message: 'No ID provided, can\'t play rewind in unknown file',
        status: '400 - Bad Request',
        error: 'Missing ID'
      };

      console.warn(responseJson)

      res.statusCode = 400;
      if (acceptsHTML) {
        res.render('player_error', responseJson);
      } else {
        res.json(responseJson);
      }
    } else {
      var tagId = req.params.id;

      // TODO call playerController to rewind
      //thePlayer.rewind(plr, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });
}

module.exports = playerRouter;
