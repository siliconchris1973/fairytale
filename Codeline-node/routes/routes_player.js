var playerRouter = function(router) {
  // get global app variables
  var DEBUG = router.get('DEBUG');
  var TRACE = router.get('TRACE');

  var playerProto = router.get('playerProto');
  var playerAddr = router.get('playerAddr');
  var playerPort = router.get('playerPort');
  var playerApi = router.get('playerApi');
  var playerUrl = router.get('playerUrl');

  // redirects
  router.get("/player", function(req, res){
    res.redirect(playerApi+"/player");
  });
  router.get(playerApi+"/player", function(req, res){
    res.redirect(playerApi+"/player/info");
  });
  router.get("/player/info", function(req, res){
    res.redirect(playerApi+"/player/info");
  });


  // the player
  router.get(playerApi+"/player/info", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/info");
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    var respEndpoints = {
        endpoints: [
            {
              shortcut: 'info',
              endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/info',
              description: 'the root entry of the mp3 player API'
            },
            {
              shortcut: 'play',
              endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/play',
              description: 'play a given mp3 file'
            },
            {
              shortcut: 'stop',
              endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/stop',
              description: 'stop playing - only available in case a file is played'
            },
            {
              shortcut: 'pause',
              endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/pause',
              description: 'pause playback - only available in case a file is played'
            },
            {
              shortcut: 'skip',
              endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/skip',
              description: 'skip 10 seconds of played file - only available in case a file is played'
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
              description: 'jump to next file for currently played album - only available in case of multiple files per album'
            },
            {
              shortcut: 'previous',
              endpoint: playerProto + '://' + playerAddr+':'+playerPort+playerApi+playerUrl+'/:id/prev',
              description: 'jump to previous file of currently played album - only available in case of multiple files per album'
            }
        ]
    };
    if (TRACE) console.log(respEndpoints);

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      res.render('player', {
          title: 'MP3 Player Startseite',
          headline: 'MP3 Player Startseite',
          subheadline: 'Willkommen',
          messagetext: 'Bitte eine Option w&auml;hlen',
          Endpoints: respEndpoints
      });
    } else {
      if (DEBUG) console.log("json request");
      res.json(respEndpoints);
    }
  })

  // play a song, takes a filename as argument in the form of:
  //  localhost:3000/player/play?file=filename.mp3
  router.get(playerApi+"/player/:id/play", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/play");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    var fileToPlay = 'UNDEF';
    if (TRACE) console.log(req);

    if(!req.query.id) {
      console.error("player warn: no file provided")

      if (acceptsHTML) {
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Player Warnung',
          errorname: 'Error',
          errortext: 'No file to play provided',
          exceptionname: 'Exception',
          exceptiontext: 'No exception'
        });
      } else {
          res.json({response: 'warn', message: 'no file provided'});
      }
    } else {
      try {
        // TODO implement function to start playback
        console.log("player: playing " + fileToPlay);
        if (acceptsHTML) {
          res.render('player', {
              title: 'MP3 Player Playseite',
              headline: 'MP3 Player Playseite',
              subheadline: 'Playing...',
              messagetext: 'Playing file ' + fileToPlay
          });
        } else {
          res.json({response: 'info', message: 'playing file '+fileToPlay});
        }
      } catch (ex) {
        if (acceptsHTML) {
          res.render('player_error', {
            title: 'Player Fehlerseite',
            headline: 'Player Fehler',
            errorname: 'Error',
            errortext: 'Error playing file ' + fileToPlay,
            exceptionname: 'Exception',
            exceptiontext: ex.toString()
          });
        } else {
          res.json({response: 'error', message: 'error playing file '+fileToPlay, exception: ex.toString});
        }
      }
    }
  })

  // stop the currently played file
  router.get(playerApi+"/player/:id/stop", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/stop");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    var fileToPlay = 'UNDEF';

    if(!req.query.id) {
      console.error("player warn: no file provided provided")

      if (acceptsHTML) {
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Player Warnung',
          errorname: 'Error',
          errortext: 'No file to play provided',
          exceptionname: 'Exception',
          exceptiontext: 'No exception'
        });
      } else {
          res.json({response: 'warn', message: 'no file provided'});
      }
    } else {
        try {
        // TODO implement function to stop playback
        console.log("player: stopping " + fileToPlay);
        if (acceptsHTML) {
          res.render('player', {
              title: 'MP3 Player Playseite',
              headline: 'MP3 Player Playseite',
              subheadline: 'Playing...',
              messagetext: 'Playing file ' + fileToPlay
          });
        } else {
          res.json({response: 'info', message: 'stopping playback of file '+fileToPlay});
        }
      } catch (ex) {
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          res.render('player_error', {
            title: 'Player Fehlerseite',
            headline: 'Player Fehler',
            errorname: 'Error',
            errortext: 'Error stopping file ' + fileToPlay,
            exceptionname: 'Exception',
            exceptiontext: ex.toString()
          });
        } else {
          if (DEBUG) console.log("json request");
          res.json({response: 'error', message: 'error stopping playback of file '+fileToPlay, exception: ex.toString});
        }
      }
    }
  })

  // skip n number of seconds of currently played file
  router.get(playerApi+"/player/:id/skip", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/skip");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    var numberOfSeconds = Number(10);

    if(!req.query.seconds) {
      console.warn("warning: did not receive number of seconds provide with ?seconds=number of seconds")
    } else {
      numberOfSeconds = req.query.seconds;
      if (DEBUG) console.log('numberOfSeconds to skip set to ' + numberOfSeconds);
    }

    if(!req.query.id) {
      console.error("player warn: no file provided provided")

      if (acceptsHTML) {
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Player Warnung',
          errorname: 'Error',
          errortext: 'No file to play provided',
          exceptionname: 'Exception',
          exceptiontext: 'No exception'
        });
      } else {
          res.json({response: 'warn', message: 'no file provided'});
      }
    } else {
      try {
        // TODO implement function to skip n seconds;
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");

          res.render('player', {
              title: 'MP3 Player Skipeite',
              headline: 'MP3 Player Skipseite',
              subheadline: 'Skipping...',
              messagetext: 'Skipped ' + numberOfSeconds + ' number of seconds'
          });
        } else {
          if (DEBUG) console.log("json request");
          res.json({response: 'info', message: 'skipped '+numberOfSeconds + ' seconds'});
        }
      } catch (ex) {
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          res.render('player_error', {
            title: 'Player Fehlerseite',
            headline: 'Player Fehler',
            errorname: 'Error',
            errortext: 'Error skipping ' + numberOfSeconds + ' in file ' + fileToPlay,
            exceptionname: 'Exception',
            exceptiontext: ex.toString()
          });
        } else {
          if (DEBUG) console.log("json request");
          res.json({response: 'error', message: 'error skipping '+numberOfSeconds+' seconds of file '+fileToPlay, error: ex.toString});
        }
      }
    }
  })

  // play next file of current album
  router.get(playerApi+"/player/:id/next", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/next");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.query.id) {
      console.error("player warn: no file provided provided")

      if (acceptsHTML) {
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Player Warnung',
          errorname: 'Error',
          errortext: 'No file to play provided',
          exceptionname: 'Exception',
          exceptiontext: 'No exception'
        });
      } else {
          res.json({response: 'warn', message: 'no file provided'});
      }
    } else {
      try {
        // TODO implement function to jump to next file
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          res.render('player', {
              title: 'MP3 Player Jumpeite',
              headline: 'MP3 Player Jumpseite',
              subheadline: 'Jumping...',
              messagetext: 'Jumping to next file of file ' + fileToPlay
          });
        } else {
            if (DEBUG) console.log("json request");
            res.json({response: 'info', message: 'jumping to next file'});
        }
      } catch (ex) {
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          res.render('player_error', {
            title: 'Player Fehlerseite',
            headline: 'Player Fehler',
            errorname: 'Error',
            errortext: 'Error jumping to next file of ' + fileToPlay,
            exceptionname: 'Exception',
            exceptiontext: ex.toString()
          });
        } else {
          if (DEBUG) console.log("json request");
          res.json({response: 'error', message: 'jumping to next file failed', error: ex.toString});
        }
      }
    }
  })

  // play next file of current album
  router.get(playerApi+"/player/:id/prev", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/prev");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.query.id) {
      console.error("player warn: no file provided provided")

      if (acceptsHTML) {
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Player Warnung',
          errorname: 'Error',
          errortext: 'No file to play provided',
          exceptionname: 'Exception',
          exceptiontext: 'No exception'
        });
      } else {
          res.json({response: 'warn', message: 'no file provided'});
      }
    } else {
      try {
        // TODO implement function to jump to next file
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          res.render('player', {
              title: 'MP3 Player Jumpeite',
              headline: 'MP3 Player Jumpseite',
              subheadline: 'Jumping...',
              messagetext: 'Jumping to previous file of file ' + fileToPlay
          });
        } else {
            if (DEBUG) console.log("json request");
            res.json({response: 'info', message: 'jumping to previous file'});
        }
      } catch (ex) {
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          res.render('player_error', {
            title: 'Player Fehlerseite',
            headline: 'Player Fehler',
            errorname: 'Error',
            errortext: 'Error jumping to previous file of ' + fileToPlay,
            exceptionname: 'Exception',
            exceptiontext: ex.toString()
          });
        } else {
          if (DEBUG) console.log("json request");
          res.json({response: 'error', message: 'jumping to previous file failed', error: ex.toString});
        }
      }
    }
  })


  // fast forward in current file
  router.get(playerApi+"/player/:id/forward", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/forward");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.query.id) {
      console.error("player warn: no file provided provided")

      if (acceptsHTML) {
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Player Warnung',
          errorname: 'Error',
          errortext: 'No file to play provided',
          exceptionname: 'Exception',
          exceptiontext: 'No exception'
        });
      } else {
          res.json({response: 'warn', message: 'no file provided'});
      }
    } else {
      try {
        // TODO implement function to jump to next file
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          res.render('player', {
              title: 'MP3 Player Jumpeite',
              headline: 'MP3 Player Jumpseite',
              subheadline: 'Jumping...',
              messagetext: 'Forwarding in file ' + fileToPlay
          });
        } else {
          if (DEBUG) console.log("json request");
          res.json({response: 'info', message: 'forwarding in file ' + fileToPlay});
        }
      } catch (ex) {
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          res.render('player_error', {
            title: 'Player Fehlerseite',
            headline: 'Player Fehler',
            errorname: 'Error',
            errortext: 'Error forwarding in file ' + fileToPlay + ' failed',
            exceptionname: 'Exception',
            exceptiontext: ex.toString()
          });
        } else {
          if (DEBUG) console.log("json request");
          res.json({response: 'error', message: 'forwarding in file ' +fileToPlay+ ' failed', error: ex.toString});
        }
      }
    }
  })

  // rewind in current file
  router.get(playerApi+"/player/:id/rewind", function(req, res) {
    if (DEBUG) console.log("GET::"+playerApi+"/player/:id/rewind");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.query.id) {
      console.error("player warn: no file provided provided")

      if (acceptsHTML) {
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Player Warnung',
          errorname: 'Error',
          errortext: 'No file to play provided',
          exceptionname: 'Exception',
          exceptiontext: 'No exception'
        });
      } else {
          res.json({response: 'warn', message: 'no file provided'});
      }
    } else {
      try {
        // TODO implement function to jump to next file
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          res.render('player', {
              title: 'MP3 Player Jumpeite',
              headline: 'MP3 Player Jumpseite',
              subheadline: 'Jumping...',
              messagetext: 'Rewinding in file ' + fileToPlay
          });
        } else {
          if (DEBUG) console.log("json request");
          res.json({response: 'info', message: 'rewinding in file ' + fileToPlay});
        }
      } catch (ex) {
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          res.render('player_error', {
            title: 'Player Fehlerseite',
            headline: 'Player Fehler',
            errorname: 'Error',
            errortext: 'Error rewinding in file ' + fileToPlay + ' failed',
            exceptionname: 'Exception',
            exceptiontext: ex.toString()
          });
        } else {
          if (DEBUG) console.log("json request");
          res.json({response: 'error', message: 'rewinding in file ' +fileToPlay+ ' failed', error: ex.toString});
        }
      }
    }
  })
}

module.exports = playerRouter;
