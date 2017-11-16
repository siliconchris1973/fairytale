var path = require('path');
var fs = require('fs');
var http = require('http');

var config = require('../../../../modules/configuration.js');

// CONFIG data on the app
const svrAppName = config.appEndpoint.AppName;
const svrProtocol = config.appEndpoint.Protocol;
const svrHost = config.appEndpoint.Host;
const svrPort = Number(config.appEndpoint.Port);
const svrApi = config.appEndpoint.Api;
const svrUrl = config.appEndpoint.Url;
const svrHealthUri = config.appEndpoint.HealthUri;
const svrHelpUri = config.appEndpoint.HelpUri;
const svrDescription = config.appEndpoint.Description;

// CONFIG data on the file Upload Service
const fileServiceAppName = config.fileServiceEndpoint.AppName;
const fileServiceProtocol = config.fileServiceEndpoint.Protocol;
const fileServiceHost = config.fileServiceEndpoint.Host;
const fileServicePort = Number(config.fileServiceEndpoint.Port);
const fileServiceApi = config.fileServiceEndpoint.Api;
const fileServiceUrl = config.fileServiceEndpoint.Url;
const fileServiceHealthUri = config.fileServiceEndpoint.HealthUri;
const fileServiceHelpUri = config.fileServiceEndpoint.HelpUri;
const fileServiceDescription = config.fileServiceEndpoint.Description;

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

// CONFIG data on the RFID/NFC Tag DB Service
const tagDbServiceAppName = config.tagDbServiceEndpoint.AppName;
const tagDbServiceProtocol = config.tagDbServiceEndpoint.Protocol;
const tagDbServiceHost = config.tagDbServiceEndpoint.Host;
const tagDbServicePort = Number(config.tagDbServiceEndpoint.Port);
const tagDbServiceApi = config.tagDbServiceEndpoint.Api;
const tagDbServiceUrl = config.tagDbServiceEndpoint.Url;
const tagDbServiceHealthUri = config.tagDbServiceEndpoint.HealthUri;
const tagDbServiceHelpUri = config.tagDbServiceEndpoint.HelpUri;
const tagDbServiceDescription = config.tagDbServiceEndpoint.Description;

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

const soundDir = config.directories.SoundDir;
const mediaDir = config.directories.MediaDir;
const tagDB = config.directories.TagDB;

var playerController = require('../../../../controller/playerController.js');

var playerRouter = function(app) {
  // the root entry shall show what could be done
  app.get(playerApi+"/player/endpoints", function(req, res) {
    if (DEBUG) console.log('GET::'+svrApi+'/endpoints');
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');
    var obj = playerController.getEndpoints(app);

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      res.render('endpoints', {
          title: 'Welcome to Fairytale Player',
          headline: 'Player API Endpunkte',
          subheadline: 'Verf&uuml;gbare REST Endpunkte f&uuml;r den Player',
          messagetext: '&Uuml;ber die Navigation kannst Du die einzelnen Funktionen ausw&auml;hlen',
          varEndpoints: obj.endpoints
      });
    } else {
      if (DEBUG) console.log("json request");
      var respEndpoints = {
        response: 'REST API Endpoints available',
        endpoints: obj.endpoints
        };
      res.json(respEndpoints);
    }
  });

  // the player
  app.get(playerApi+"/player/info", function(req, res) {
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


  app.get(playerApi+"/player/:id/play", function(req, res) {
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
      //thePlayer.play(app, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });

  app.get(playerApi+"/player/:id/stop", function(req, res) {
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
      //thePlayer.stop(app, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });


  // TODO player PAUSE
  app.get(playerApi+"/player/:id/pause", function(req, res) {
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
      //thePlayer.pause(app, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });

  // TODO play next file of current album
  app.get(playerApi+"/player/:id/next", function(req, res) {
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
      //thePlayer.next(app, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });


  // TODO play prev file of current album
  app.get(playerApi+"/player/:id/prev", function(req, res) {
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
      //thePlayer.prev(app, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });


  // TODO All these do not work currently, as the player is not updating it's position
  app.get(playerApi+"/player/:id/skip", function(req, res) {
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
      //thePlayer.skip(app, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });

  app.get(playerApi+"/player/:id/forward", function(req, res) {
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
      //thePlayer.forward(app, tagId);

      if (acceptsHTML) {
        var respObj = responseJson;
        res.render('player_view', respObj);
      } else {
        res.json(responseJson);
      }
    }
  });

  app.get(playerApi+"/player/:id/rewind", function(req, res) {
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
      //thePlayer.rewind(app, tagId);

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
