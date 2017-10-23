var path = require('path');
var fs = require('fs');

var playerRouter = function(app) {
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var svrAddr = app.get('svrAddr');
  var dataDir = app.get('dataDir');
  var mediaDir = app.get('mediaDir');

  // the player
  app.get("/player", function(req, res) {
    if (DEBUG) console.log("player entry requested");
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");

      res.render('player', {
          title: 'MP3 Player Startseite',
          headline: 'MP3 Player Startseite',
          subheadline: 'Willkommen',
          messagetext: 'Bitte eine Option w&auml;hlen',
          controlheadline: 'Verfügbare Kommandos'
      });
    } else {
      if (DEBUG) console.log("json request");
      res.json({
          response: 'REST API for the mp3 Player',
          endpoints: [
              {endpoint: svrAddr+'/player', description: 'the root entry of the mp3 player API'},
              {endpoint: svrAddr+'/player/play', description: 'play a given mp3 file'},
              {endpoint: svrAddr+'/player/stop', description: 'stop playing - only available in case a file is played'},
              {endpoint: svrAddr+'/player/pause', description: 'pause playback - only available in case a file is played'},
              {endpoint: svrAddr+'/player/skip', description: 'skip 10 seconds of played file - only available in case a file is played'},
              {endpoint: svrAddr+'/player/forward', description: 'fast forward in current file'},
              {endpoint: svrAddr+'/player/rewind', description: 'rewind in current file'},
              {endpoint: svrAddr+'/player/next', description: 'jump to next file for currently played album'},
              {endpoint: svrAddr+'/player/prev', description: 'jump to previous file of currently played album'}
          ]
      });
    }
  })

  // play a song, takes a filename as argument in the form of:
  //  localhost:3000/player/play?file=filename.mp3
  app.get("/player/play", function(req, res) {
    if (DEBUG) console.log("player play requested");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(!req.query.file) {
      console.error("player error: no file provided - provide with ?file=filename.mp3")

      if (acceptsHTML) {
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Player Fehler',
          errorname: 'Error',
          errortext: 'No file to play provided',
          exceptionname: 'Exception',
          exceptiontext: 'No exception',
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
          res.json({response: 'error', message: 'no file provided, provide with ?file=filename'});
      }
    } else {
      var songToPlay=req.query.file;
      // holds the file the player shall play :-)
      var fileToPlay = path.join('data','AudioBooks',songToPlay);

      // TODO: move this into a script in modules directory so that we only deal with the routes here.
      var player = require('play-sound')(opts = {});
      try {
        var audio = player.play(fileToPlay, function(err){
          if (err && !err.killed) {
            console.error("player error: playing file " + fileToPlay);
            if (acceptsHTML) {
                if (DEBUG) console.log("html request");

                res.render('', {
                  title: 'Player Fehlerseite',
                  headline: 'Player Fehler',
                  errorname: 'Error',
                  errortext: 'Error playing file ' + fileToPlay,
                  exceptionname: 'Exception',
                  exceptiontext: err.toString(),
                  controlheadline: 'Verf&uuml;gbare Kommandos'
                });
            } else {
                if (DEBUG) console.log("json request");
                res.json({response: 'error', message: 'error playing file '+fileToPlay, exception: err.toString});
            }
            //throw err
          }
        });
      } catch (err) {
        if (acceptsHTML) {
          res.render('player_error', {
            title: 'Player Fehlerseite',
            headline: 'Player Fehler',
            errorname: 'Error',
            errortext: 'Error playing file ' + fileToPlay,
            exceptionname: 'Exception',
            exceptiontext: err.toString(),
            controlheadline: 'Verf&uuml;gbare Kommandos'
          });
        } else {
          res.json({response: 'error', message: 'error playing file '+fileToPlay, exception: err.toString});
        }
      }

      console.log("player: playing " + fileToPlay);
      if (acceptsHTML) {
        res.render('player', {
            title: 'MP3 Player Playseite',
            headline: 'MP3 Player Playseite',
            subheadline: 'Playing...',
            messagetext: 'Playing file ' + fileToPlay,
            controlheadline: 'Verfügbare Kommandos'
        });
      } else {
        res.json({response: 'info', message: 'playing file '+fileToPlay});
      }
    }
  })

  // stop the currently played file
  app.get("/player/stop", function(req, res) {
    if (DEBUG) console.log("player stop requested");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    try {
      audio.kill();
      if (acceptsHTML) {
        if (DEBUG) console.log("html request");
        res.render('player', {
            title: 'MP3 Player Stopeite',
            headline: 'MP3 Player Stopseite',
            subheadline: 'Stopping...',
            messagetext: 'Stopped playback of ' + fileToPlay,
            controlheadline: 'Verfügbare Kommandos'
        });
      } else {
          if (DEBUG) console.log("json request");
          res.json({response: 'info', message: 'playback of file '+fileToPlay + ' stopped'});
      }
    } catch (err) {
      if (acceptsHTML) {
        if (DEBUG) console.log("html request");
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Player Fehler',
          errorname: 'Error',
          errortext: 'Error stopping file ' + fileToPlay,
          exceptionname: 'Exception',
          exceptiontext: err.toString(),
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
        if (DEBUG) console.log("json request");
        res.json({response: 'error', message: 'error stopping playback of file '+fileToPlay, exception: err.toString});
      }
    }
  })

  // skip n number of seconds of currently played file
  app.get("/player/skip", function(req, res) {
      if (DEBUG) console.log("player skip requested");

      // the server checks whether the client accepts html (browser) or
      // json machine to machine communication
      var acceptsHTML = req.accepts('html');
      var acceptsJSON = req.accepts('json');

      if(!req.query.seconds) {
        console.error("player error: you must provide number of seconds to skip - provide with ?seconds=number of seconds")

        if (acceptsHTML) {
          res.render('player_error', {
            title: 'Player Fehlerseite',
            headline: 'Player Fehler',
            errorname: 'Error',
            errortext: 'You must provide number of seconds to skip',
            exceptionname: 'Exception',
            exceptiontext: 'No Exceptoin',
            controlheadline: 'Verf&uuml;gbare Kommandos'
          });
        } else {
            res.json({response: 'error', message: 'you must provide number of seconds to skip - provide with ?seconds=number of seconds'});
        }
      } else {
        var numberOfSeconds = req.query.seconds;
        try {
          // TODO implement function to skip n seconds;
          if (acceptsHTML) {
            if (DEBUG) console.log("html request");

            res.render('player', {
                title: 'MP3 Player Skipeite',
                headline: 'MP3 Player Skipseite',
                subheadline: 'Skipping...',
                messagetext: 'Skipped ' + numberOfSeconds + ' number of seconds',
                controlheadline: 'Verfügbare Kommandos'
            });
          } else {
            if (DEBUG) console.log("json request");
            res.json({response: 'info', message: 'skipped '+numberOfSeconds + ' seconds'});
          }
        } catch (err) {
          if (acceptsHTML) {
            if (DEBUG) console.log("html request");
            res.render('player_error', {
              title: 'Player Fehlerseite',
              headline: 'Player Fehler',
              errorname: 'Error',
              errortext: 'Error skipping ' + numberOfSeconds + ' in file ' + fileToPlay,
              exceptionname: 'Exception',
              exceptiontext: err.toString(),
              controlheadline: 'Verf&uuml;gbare Kommandos'
            });
          } else {
            if (DEBUG) console.log("json request");
            res.json({response: 'error', message: 'error skipping '+numberOfSeconds+' seconds of file '+fileToPlay, exception: err.toString});
          }
        }
      }
  })

  // play next file of current album
  app.get("/player/next", function(req, res) {
    if (DEBUG) console.log("player next requested");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    try {
      // TODO implement function to jump to next file
      if (acceptsHTML) {
        if (DEBUG) console.log("html request");
        res.render('player', {
            title: 'MP3 Player Jumpeite',
            headline: 'MP3 Player Jumpseite',
            subheadline: 'Jumping...',
            messagetext: 'Jumping to next file of file ' + fileToPlay,
            controlheadline: 'Verfügbare Kommandos'
        });
      } else {
          if (DEBUG) console.log("json request");
          res.json({response: 'info', message: 'jumping to next file'});
      }
    } catch (err) {
      if (acceptsHTML) {
        if (DEBUG) console.log("html request");
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Player Fehler',
          errorname: 'Error',
          errortext: 'Error jumping to next file of ' + fileToPlay,
          exceptionname: 'Exception',
          exceptiontext: err.toString(),
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
        if (DEBUG) console.log("json request");
        res.json({response: 'error', message: 'jumping to next file failed', exception: err.toString});
      }
    }
  })

  // play next file of current album
  app.get("/player/prev", function(req, res) {
      if (DEBUG) console.log("player prev requested");

      // the server checks whether the client accepts html (browser) or
      // json machine to machine communication
      var acceptsHTML = req.accepts('html');
      var acceptsJSON = req.accepts('json');

      try {
        // TODO implement function to jump to next file
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          res.render('player', {
              title: 'MP3 Player Jumpeite',
              headline: 'MP3 Player Jumpseite',
              subheadline: 'Jumping...',
              messagetext: 'Jumping to previous file of file ' + fileToPlay,
              controlheadline: 'Verfügbare Kommandos'
          });
        } else {
            if (DEBUG) console.log("json request");
            res.json({response: 'info', message: 'jumping to previous file'});
        }
      } catch (err) {
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          res.render('player_error', {
            title: 'Player Fehlerseite',
            headline: 'Player Fehler',
            errorname: 'Error',
            errortext: 'Error jumping to previous file of ' + fileToPlay,
            exceptionname: 'Exception',
            exceptiontext: err.toString(),
            controlheadline: 'Verf&uuml;gbare Kommandos'
          });
        } else {
          if (DEBUG) console.log("json request");
          res.json({response: 'error', message: 'jumping to previous file failed', exception: err.toString});
        }
      }
  })


  // fast forward in current file
  app.get("/player/forward", function(req, res) {
    if (DEBUG) console.log("player forward requested");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    try {
      // TODO implement function to jump to next file
      if (acceptsHTML) {
        if (DEBUG) console.log("html request");
        res.render('player', {
            title: 'MP3 Player Jumpeite',
            headline: 'MP3 Player Jumpseite',
            subheadline: 'Jumping...',
            messagetext: 'Forwarding in file ' + fileToPlay,
            controlheadline: 'Verfügbare Kommandos'
        });
      } else {
        if (DEBUG) console.log("json request");
        res.json({response: 'info', message: 'forwarding in file ' + fileToPlay});
      }
    } catch (err) {
      if (acceptsHTML) {
        if (DEBUG) console.log("html request");
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Player Fehler',
          errorname: 'Error',
          errortext: 'Error forwarding in file ' + fileToPlay + ' failed',
          exceptionname: 'Exception',
          exceptiontext: err.toString(),
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
        if (DEBUG) console.log("json request");
        res.json({response: 'error', message: 'forwarding in file ' +fileToPlay+ ' failed', exception: err.toString});
      }
    }
  })

  // rewind in current file
  app.get("/player/rewind", function(req, res) {
    if (DEBUG) console.log("player rewind requested");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    try {
      // TODO implement function to jump to next file
      if (acceptsHTML) {
        if (DEBUG) console.log("html request");
        res.render('player', {
            title: 'MP3 Player Jumpeite',
            headline: 'MP3 Player Jumpseite',
            subheadline: 'Jumping...',
            messagetext: 'Rewinding in file ' + fileToPlay,
            controlheadline: 'Verfügbare Kommandos'
        });
      } else {
        if (DEBUG) console.log("json request");
        res.json({response: 'info', message: 'rewinding in file ' + fileToPlay});
      }
    } catch (err) {
      if (acceptsHTML) {
        if (DEBUG) console.log("html request");
        res.render('player_error', {
          title: 'Player Fehlerseite',
          headline: 'Player Fehler',
          errorname: 'Error',
          errortext: 'Error rewinding in file ' + fileToPlay + ' failed',
          exceptionname: 'Exception',
          exceptiontext: err.toString(),
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
        if (DEBUG) console.log("json request");
        res.json({response: 'error', message: 'rewinding in file ' +fileToPlay+ ' failed', exception: err.toString});
      }
    }
  })
}

module.exports = playerRouter;
