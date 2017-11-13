var playerRouter = function(plr) {
  var http = require('http');
  var path = require('path');

  // get global app variables
  var DEBUG = plr.get('DEBUG');
  var TRACE = plr.get('TRACE');

  const playerProto = plr.get('playerProto');
  const playerAddr = plr.get('playerAddr');
  const playerPort = plr.get('playerPort');
  const playerApi = plr.get('playerApi');
  const playerUrl = plr.get('playerUrl');

  //var tagController = require('../controller/tagController.js');
  var thePlayer = require('../controller/playerController.js');

  const playerEndpoints = {
    endpoints: [
      {
        shortcut: 'info',
        endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/info',
        description: 'the root entry of the mp3 player API',
        alive: 'true'
      },
      {
        shortcut: 'play',
        endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/play',
        description: 'play a given mp3 file'
      },
      {
        shortcut: 'stop',
        endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/stop',
        description: 'stop playing'
      },
      {
        shortcut: 'pause',
        endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/pause',
        description: 'pause playback'
      },
      {
        shortcut: 'skip',
        endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/skip',
        description: 'skip 10 seconds of played file'
      },
      {
        shortcut: 'forward',
        endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/forward',
        description: 'fast forward in current file'
      },
      {
        shortcut: 'rewind',
        endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/rewind',
        description: 'rewind in current file'
      },
      {
        shortcut: 'next',
        endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/next',
        description: 'jump to next file for currently played album'
      },
      {
        shortcut: 'prev',
        endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/prev',
        description: 'jump to previous file of currently played album'
      }
    ]
  };


  // redirects
  plr.get("/", function(req, res){
    res.redirect(playerApi+"/player");
  });
  plr.get("/player", function(req, res){
    res.redirect(playerApi+"/player");
  });
  plr.get(playerApi+"/player", function(req, res){
    res.redirect(playerApi+"/player/info");
  });
  plr.get("/player/info", function(req, res){
    res.redirect(playerApi+"/player/info");
  });
  plr.get("/player/demo", function(req, res){
    res.redirect(playerApi+"/player/demo");
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
      thePlayer.play(plr, tagId);

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
