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

  // get the REST API for the tags db - this is where we get
  // information on tags (usually by issueing a GET to the API tags/tag/:ID) from
  const tagDbServiceProto = plr.get('tagDbServiceProto');
  const tagDbServiceAddr = plr.get('tagDbServiceAddr');
  const tagDbServicePort = plr.get('tagDbServicePort');
  const tagDbServiceApi = plr.get('tagDbServiceApi');
  const tagDbServiceUrl = plr.get('tagDbServiceUrl');

  const soundDir = plr.get('SoundDir');
  const mediaDir = plr.get('MediaDir');
  const tagDB = plr.get('TagDB');

  var tagController = require('../modules/tagController.js');
  var thePlayer = require('../modules/thePlayer.js');
  myPlr = new thePlayer();

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
        shortcut: 'previous',
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

  // startup sounds of player
  plr.get(playerApi+"/player/demo", function(req, res){
    if (DEBUG) console.log("GET::"+playerApi+"/player/demo");

    // play a gong as a demo
    var f = soundDir + '/schulglocke-3-mal.mp3';
    myPlr.state.filename = f;

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    var responseJson = {
      headline: 'MP3 Player API Demoseite',
      subheadline: 'Spiele Demo Sound ' + f,
      messagetext: 'Du solltest nun was h&ouml;ren'
    };

    res.setHeader('X-Powered-By', 'bacon');

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      if (DEBUG) console.log('playing demo sound ' + f + ' with the player');
      myPlr.playTrack();

      var endObj = responseJson;
      res.render('player_view', endObj);
    } else {
      if (DEBUG) console.log("json request");
      res.json({
        response: 'unavailable',
        status: 415,
        message: 'this endpoint is not available for json requests'
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

    var fileToPlay = 'UNDEF';
    if (TRACE) console.log(req);

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
      var trackId = req.params.id;

      // get all the necesary information on the album and the track to be played
      var tagId = trackId.substring(0,trackId.indexOf(':'));
      var subStrDiskTrack = trackId.substring(trackId.indexOf(':')+1);
      var diskNo = subStrDiskTrack.substring(1,subStrDiskTrack.indexOf(':'));
      var trackNo = subStrDiskTrack.substring(subStrDiskTrack.indexOf(':')+2);

      if (TRACE) console.log('IDs: \n   trackId: ' + trackId + '\n   tagId: ' + tagId + '\n   subStrDiskTrack: ' +  subStrDiskTrack + '\n   diskNo: ' + diskNo + '\n   trackNo: ' + trackNo);

        var options = {
          protocol: tagDbServiceProto + ':',
          host: tagDbServiceAddr,
          port: Number(tagDbServicePort),
          path: tagDbServiceApi+tagDbServiceUrl+'/tag/' + tagId,
          family: 4,
          headers: {'User-Agent': 'request', 'Content-Type': 'application/json', 'Accept': 'application/json'},
          method: 'GET'
        };
        if (DEBUG) console.log('sending http request to tagDbService REST api');
        if (TRACE) console.log(options);

        http.request(options, function(innerres) {
          if (DEBUG) console.log('STATUS: ' + innerres.statusCode);
          if (TRACE) console.log('HEADERS: ' + JSON.stringify(innerres.headers));
          var body = '';

          innerres.on('data', function(chunk){
              body += chunk;
          });

          innerres.on('end', function(){
            var fbResponse = JSON.parse(body);
            if (TRACE) console.log("Got a response: ", fbResponse);
            var obj = fbResponse;
            if (DEBUG) console.log('providing data to player play site');

            var trackname = 'UNDEF';
            var trackpath = 'UNDEF';
            var lastposition = 'UNDEF';
            var playcount = 'UNDEF';
            var trackCount = 0;
            var pictureCount = 0;

            if (obj.MediaFiles.length > 0) trackCount = obj.MediaFiles.length;
            if (obj.MediaPicture.length > 0) pictureCount = obj.MediaPicture.length;

            for (i in obj.MediaFiles) {
              if (obj.MediaFiles[i].id == trackId) {
                trackname = obj.MediaFiles[i].name;
                trackpath = obj.MediaFiles[i].path;
                lastposition = obj.MediaFiles[i].lastposition;
                playcount = obj.MediaFiles[i].playcount;
              }
            }

              console.log("player: playing " + trackpath);

              // play the requested file
              var f = path.join(mediaDir,tagId,trackpath);
              if (TRACE) console.log(' file to play: ' + f);
              myPlr.state.filename = f;
              myPlr.playTrack();

              var responseJson = {
                response: 'info',
                message: 'Spiele '+trackname,
                tagdata: { tagId: obj.tagdata.TagId },
                mediadata: {
                  MediaTitle: obj.MediaTitle,
                  MediaType: obj.MediaType,
                  MediaGenre: obj.MediaGenre,
                  MediaDescription: obj.MediaDescription,
                  MediaFiles: obj.MediaFiles,
                  MediaPictures: obj.MediaPicture,
                  DiskCount: obj.DiskCount,
                  TrackCount: trackCount,
                  PictureCount: pictureCount,
                  TrackId: trackId,
                  TrackName: trackname,
                  TrackPath: trackpath,
                  LastPosition: lastposition,
                  PlayCount: playcount,
                  TrackNo: trackNo,
                  DiskNo: diskNo
                }
              }
              if (acceptsHTML) {
                var respObj = responseJson;
                res.render('player_view', respObj);
              } else {
                res.json(responseJson);
              }
          });
        }).on('error', function(e){
          res.statusCode = 500;
          var errObj = e;
          var responseJson = {
            response: 'Error',
            message: 'Could not retrieve data for track with id ' + trackId,
            status: '500 - internal server error',
            error: errObj
          };
          console.error(responseJson);

          res.statusCode = 500;
          if (acceptsHTML) {
            res.render('tags_error', responseJson);
          } else {
            res.json(responseJson);
          }
        }).end();
    }
  });

  plr.get(playerApi+"/player/:id/stop", function(req, res) {
    myPlr.stop();
  });

  plr.get(playerApi+"/player/:id/pause", function(req, res) {
    myPlr.togglePause();
  });





  // TODO play next file of current album
  //plr.get(playerApi+"/player/:id/next", function(req, res) {});


  // TODO play prev file of current album
  //plr.get(playerApi+"/player/:id/prev", function(req, res) {});


  // TODO All these do not work currently, as the player is not updating it's position
  plr.get(playerApi+"/player/:id/skip", function(req, res) {
    myPlr.updatePosition();
  });
  plr.get(playerApi+"/player/:id/forward", function(req, res) {
    myPlr.fastForward();
  });
  plr.get(playerApi+"/player/:id/ff", function(req, res) {
    myPlr.fastForward();
  });
  plr.get(playerApi+"/player/:id/rewind", function(req, res) {
    myPlr.rewind();
  });
  plr.get(playerApi+"/player/:id/rew", function(req, res) {
    myPlr.rewind();
  });
}

module.exports = playerRouter;
