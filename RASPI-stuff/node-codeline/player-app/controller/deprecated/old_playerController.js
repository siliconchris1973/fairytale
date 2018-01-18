


var fs = require('fs');
var path = require('path');
var jsonfile = require('jsonfile');

var config = require('../modules/configuration.js');

// this is the wrapper class for the MPlayer intergration
//var thePlayer = require('../modules/thePlayer');
// this is the wrapper class for the MPlayer intergration
var theRealPlayer = require('../modules/thePlayer');

// CONFIG data on the MP3 Player
const svrAppName = config.playerEndpoint.AppName;
const svrProtocol = config.playerEndpoint.Protocol;
const svrHost = config.playerEndpoint.Host;
const svrPort = Number(config.playerEndpoint.Port);
const svrApi = config.playerEndpoint.Api;
const svrUrl = config.playerEndpoint.Url;
const svrHealthUri = config.playerEndpoint.HealthUri;
const svrHelpUri = config.playerEndpoint.HelpUri;
const svrInfoUri = config.playerEndpoint.InfoUri;
const svrWelcomeUri = config.playerEndpoint.WelcomeUri;
const svrStatusUri = config.playerEndpoint.StatusUri;
const svrEndpointsUri = config.playerEndpoint.EndpointsUri;
const svrDescription = config.playerEndpoint.Description;
const svrFullUrl = svrProtocol + '://'+svrHost+':'+svrPort+svrApi+svrUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

const soundDir = config.directories.SoundDir;
const mediaDir = config.directories.MediaDir;

// this is a synchronous function that returns all the endpoints.
var getEndpoints = function() {
  if (DEBUG) console.log('getEndpoints called');
  const theEndpoints = {
    endpoints: [
      {
        AppName: 'endpoints',
        endpoint: svrFullUrl+svrEndpointsUri,
        description: 'Endpoints of the Player API',
        alive: 'true'
      },
      {
        AppName: 'info',
        endpoint: svrFullUrl+svrInfoUri,
        description: 'Info Endpoint of the Player API',
        alive: 'true'
      },
      {
        AppName: 'welcome',
        endpoint: svrFullUrl+svrWelcomeUri,
        description: 'Welcome Endpoint of the Player API',
        alive: 'true'
      },
      {
        AppName: 'help',
        endpoint: svrFullUrl+svrHelpUri,
        description: 'Help Endpoint of the Player API',
        alive: 'true'
      },
      {
        AppName: 'health',
        endpoint: svrFullUrl+svrHealthUri,
        description: 'Health Endpoint of the Player API',
        alive: 'true'
      },
      {
        AppName: 'status',
        endpoint: svrFullUrl+svrStatusUri,
        description: 'Statu Endpoint of the Player API',
        alive: 'true'
      },
      {
        AppName: 'play',
        endpoint: svrFullUrl+'/play/:id/',
        description: 'play a given mp3 file'
      },
      {
        AppName: 'stop',
        endpoint: svrFullUrl+'/stop',
        description: 'stop playing'
      },
      {
        AppName: 'pause',
        endpoint: svrFullUrl+'/pause',
        description: 'pause playback'
      },
      {
        AppName: 'skip',
        endpoint: svrFullUrl+'/skip/:seconds',
        description: 'skip seconds in playback (default 30)'
      },
      {
        AppName: 'forward',
        endpoint: svrFullUrl+'/forward/:duration',
        description: 'fast forward in playback (default 5 seconds)'
      },
      {
        AppName: 'rewind',
        endpoint: svrFullUrl+'/rewind/:duration',
        description: 'rewind in playback (default 5 seconds)'
      },
      {
        AppName: 'next',
        endpoint: svrFullUrl+'/next',
        description: 'jump to next file in album'
      },
      {
        AppName: 'previous',
        endpoint: svrFullUrl+'/prev',
        description: 'jump to previous file in album'
      },
      {
        AppName: 'get current volume',
        endpoint: svrFullUrl+'/volume',
        description: 'return current volume level'
      },
      {
        AppName: 'volume  up',
        endpoint: svrFullUrl+'/volume/up/:level',
        description: 'increase volume by level (default 1)'
      },
      {
        AppName: 'volume down',
        endpoint: svrFullUrl+'/volume/down/:level',
        description: 'decrease volume by level (default 1)'
      },
      {
        AppName: 'get current volume',
        endpoint: svrFullUrl+'/volume',
        description: 'return current volume level'
      }
    ]
  };
  return theEndpoints;
}


// the http call to the tagDb rest api wrapped in a promise
function httpRequest(params, postData) {
  return new Promise(function(resolve, reject) {
    if (DEBUG) console.log('httpRequest called against tagDbService API');
    if (TRACE) console.log(params);

    var req = http.request(params, function(innerres) {
      // reject on bad status
      if (innerres.statusCode < 200 || innerres.statusCode >= 300) {
        console.error('Status Code ' +innerres.statusCode+ ' received')
        return reject(new Error('statusCode=' + innerres.statusCode));

      }
      if (DEBUG) console.log('STATUS: ' + innerres.statusCode);
      if (TRACE) console.log('HEADERS: ' + JSON.stringify(innerres.headers));
      var body = [];

      innerres.on('data', function(chunk){
          body.push(chunk);
      });

      innerres.on('end', function(){
        try {
          body = JSON.parse(Buffer.concat(body).toString());
        } catch (ex) {
          var errObj = ex;
          var responseJson = {
            response: 'Error',
            message: 'Could not retrieve data for tag ' + tagId,
            status: 500,
            status_text: '500 - internal server error',
            error: errObj
          };
          console.error(responseJson);
          reject(responseJson);
        }
      });
    });

    req.on('error', function(err){
      var errObj = err;
      var responseJson = {
        response: 'Error',
        message: 'Could not retrieve data for tag ' + tagId,
        status: 500,
        status_text: '500 - internal server error',
        error: errObj
      };
      console.error(responseJson);
      reject(responseJson);
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  })
}


// a wrapper class around the class thePlayer from file thePlayer.js
class theOuterPlayer {
  constructor(name, position, trackId, nextTrackId, prevTrackId) {
    if (DEBUG) console.log('theOuterPlayer constructor called');
    if (TRACE) console.log('   file to play ' + name + ' / position ' + position);

    this.state = {
      paused: false,
      volume: 50,
      filename: name,
      progress: 0,
      position: position || 0,
      duration: 0,
      trackId: trackId || 'UNDEF',
      nextTrackId: nextTrackId || 'UNDEF',
      prevTrackId: prevTrackId || 'UNDEF'
    };
    if (TRACE) console.log(this.state);
    if (DEBUG) console.log('now instantiating theRealPlayer');
    var myPlr = new theRealPlayer(this.state.filename, this.state.position);
  }
  setState(stateConf) {
    var obj = stateConf;
    this.state = {
      paused: obj.pause || false,
      volume: obj.volume || 50,
      filename: obj.filename,
      progress: obj.progress || 0,
      position: obj.position || 0,
      duration: obj.duration || 0,
      trackId: obj.trackId || 'UNDEF',
      nextTrackId: obj.nextTrackId || 'UNDEF',
      prevTrackId: obj.prevTrackId || 'UNDEF'
    };
  }

  // Methods of theOuterPlayer always work on the real player
  instantiatePlayer(filename, position) {
    if (!filename) filename = soundDir + '/' + 'hello.mp3';
    if (!position) position = 0;
    if (DEBUG) console.log('instantiating new OuterPlayer with welcome sound ' + filename);
    this.state.filename = filename;
    this.state.position = position;
    this.playTrack();
  }

  playTrack (tagId) {
    const DEBUG = app.get('DEBUG');
    const TRACE = app.get('TRACE');

    if (DEBUG) console.log('thePlayer playTrack called ');
    /*
    // what to do when called without a tagId
    if (!tagId) {
      var errObj = e;
      var responseJson = {
        response: 'Error',
        message: 'No Tag Id provided',
        status: '400 - client error',
        http_code: '400',
        error: errObj
      };
      console.error(responseJson);
      return reject(responseJson);
    }
    */
    var httpParams = {
      protocol: tagDbServiceProto + ':',
      host: tagDbServiceAddr,
      port: Number(tagDbServicePort),
      path: tagDbServiceApi+tagDbServiceUrl+'/playdata/' + tagId,
      family: 4,
      headers: {'User-Agent': 'request', 'Content-Type': 'application/json', 'Accept': 'application/json'},
      method: 'GET'
    };

    if (DEBUG) console.log('sending http request to tagDbService REST api for tag ' + tagId);
    httpRequest(httpParams).then(function(body) {
      if (TRACE) console.log(body);
      // and so on
      var fbResponse = JSON.parse(body);
      var obj = fbResponse;
      if (DEBUG) console.log('providing data to player play site');
    }).then(function(body) {
      console.log(body);
      // play the requested file
      var f = path.join(mediaDir,obj.tagId,obj.trackPath);
      if (TRACE) console.log(' file to play: ' + f);
      myPlrStatus.setState(obj);
      myPlr.state.filename = f;
      myPlr.state.position = obj.lastPosition;
      myPlr.playTrack();
    });

        /*
        // from here on we provide the data for the response object
        var responseJson = {
          response: 'info',
          message: 'Spiele '+obj.trackName + ' aus ' + obj.mediaTitle,
          status: '200 - ok',
          http_code: '200',
          playerdata: {
            tagId: obj.tagId,
            trackId: obj.trackId,
            mediaTitle: obj.mediaTitle,
            trackName: obj.trackName,
            trackPath: obj.trackPath,
            lastPosition: obj.lastPosition,
            playCount: obj.playCount,
            trackNo: obj.trackNo,
            diskNo: obj.diskNo,
            nextTrackId: obj.nextTrackId,
            prevTrackId: obj.prevTrackId
          }
        };
        */
  }

  rewind(seconds) {
    if (!seconds) seconds = 5;
    if (DEBUG) console.log('thePlayer rewind called - rewinding for ' + seconds + ' seconds');

  }

  fastForward(seconds) {
    if (!seconds) seconds = 5;
    if (DEBUG) console.log('thePlayer fastForward called - forwarding for ' + seconds + ' seconds');

  }

  clear() {
    if (DEBUG) console.log('thePlayer clear called - clearing state of player');
  }

  updatePosition() {
    if (DEBUG) console.log('thePlayer updatePosition called ');
  }

  getPosition() {
    if (DEBUG) console.log('thePlayer getPosition called ');
  }

  quit() {
    if (DEBUG) console.log('thePlayer quit called ');
  }

  stop() {
    if (DEBUG) console.log('thePlayer stop called ');
  }

  togglePause() {
    if (DEBUG) console.log('thePlayer togglePause called ');
    if (false) {
      if (TRACE) console.log('   resuming');
      // resume playback
    } else {
      if (TRACE) console.log('   pausing');
      // update position and pause player
    }
  }

  volumeDown(volumeFactor) {
    if (!volumeFactor) volumeFactor = 5;
    if (DEBUG) console.log('thePlayer volumeDown called - reducing volume by ' + volumeFactor);
  }

  volumeUp(volumeFactor) {
    if (!volumeFactor) volumeFactor = 5;
    if (DEBUG) console.log('thePlayer volumeUp called - increasing volume by ' + volumeFactor);
  }
}


module.exports = {
  thePlayer: theOuterPlayer,
  getEndpoints: theOuterPlayer.getEndpoints,
  init: theOuterPlayer.instantiatePlayer,
  play: theOuterPlayer.playTrack,
  stop: theOuterPlayer.stop,
  pause: theOuterPlayer.togglePause,
  forward: theOuterPlayer.fastForward,
  rewind: theOuterPlayer.rewind,
  position: theOuterPlayer.getPosition,
  volumeUp: theOuterPlayer.volumeUp,
  volumeDown: theOuterPlayer.volumeDown
};
