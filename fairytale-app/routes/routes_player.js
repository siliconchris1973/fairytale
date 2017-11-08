var playerRouter = function(plr) {
  // get global app variables
  var DEBUG = plr.get('DEBUG');
  var TRACE = plr.get('TRACE');

  const playerProto = plr.get('playerProto');
  const playerAddr = plr.get('playerAddr');
  const playerPort = plr.get('playerPort');
  const playerApi = plr.get('playerApi');
  const playerUrl = plr.get('playerUrl');

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

      var tagFile = plr.get('rfidTagDir') + '/' + tagId + '.json';
      // check if there is a dataset available for the provided tagId
      /*
      if (!tagController.checkTagExist(tagFile)) {
        console.error('file ' + tagFile + ' does not exist');
        var responseJson = {
          response: 'Error',
          message: 'Could not retrieve data for track with id ' + trackId,
          status: '404 - Ressource not found',
          error: 'File '+tagFile+' not found'
        };
        res.statusCode = 404;
        if (acceptsHTML) {
          res.render('tags_error', responseJson);
        } else {
          res.json(responseJson);
        }
      }
      */
      tagController.getTagData(plr, tagId, function(err, result) {
        if (err) {
          var errObj = err;
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
        } else {
          var obj = result;
          if (DEBUG) console.log('providing data to player play site');
          if (TRACE) console.log(obj);

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

          try {
            // TODO implement function to start playback
            console.log("player: playing " + trackpath);

            // play the requested file
            var f = mediaDir + '/' + tagId + '/' + trackpath;
            myPlr.state.filename = f;
            myPlr.playTrack();

            var responseJson = {
              response: 'info',
              message: 'Spiele '+trackname+' - Track '+trackNo+' von Disk '+diskNo,
              tagdata: {
                tagId: obj.tagdata.TagId
              },
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
          } catch (ex) {
            var responseJson = {
              response: 'Error',
              message: 'Could not play file '+fileToPlay,
              status: '500 - internal server error',
              error: ex.toString
            }
            res.statusCode = 500;
            if (acceptsHTML) {
              res.render('player_error', responseJson);
            } else {
              res.json(responseJson);
            }
          }
        }
      });
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
