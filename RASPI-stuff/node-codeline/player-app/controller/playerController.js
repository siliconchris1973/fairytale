var fs = require('fs');
var path = require('path');
var jsonfile = require('jsonfile');

var config = require('../modules/configuration.js');

// this is the wrapper class for the MPlayer intergration
//var thePlayer = require('../modules/thePlayer');
// this is the wrapper class for the MPlayer intergration
var thePlayer = require('../modules/thePlayer');

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

// CONFIG data on the tagDB Service
const tagDbServiceAppName = config.tagDbServiceEndpoint.AppName;
const tagDbServiceProtocol = config.tagDbServiceEndpoint.Protocol;
const tagDbServiceHost = config.tagDbServiceEndpoint.Host;
const tagDbServicePort = Number(config.tagDbServiceEndpoint.Port);
const tagDbServiceApi = config.tagDbServiceEndpoint.Api;
const tagDbServiceUrl = config.tagDbServiceEndpoint.Url;
const tagDbServiceHealthUri = config.tagDbServiceEndpoint.HealthUri;
const tagDbServiceHelpUri = config.tagDbServiceEndpoint.HelpUri;
const tagDbServiceInfoUri = config.tagDbServiceEndpoint.InfoUri;
const tagDbServiceWelcomeUri = config.tagDbServiceEndpoint.WelcomeUri;
const tagDbServiceStatusUri = config.tagDbServiceEndpoint.StatusUri;
const tagDbServiceEndpointsUri = config.tagDbServiceEndpoint.EndpointsUri;
const tagDbServiceDescription = config.tagDbServiceEndpoint.Description;
const tagDbServiceFullUrl = tagDbServiceProtocol + '://'+tagDbServiceHost+':'+tagDbServicePort+tagDbServiceApi+tagDbServiceUrl;

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

var instantiatePlayer = function() {
  var f = soundDir + '/' + 'hello.mp3';
  if (DEBUG) console.log('instantiating new player with welcome sound ' + f);
  var myPlr = new thePlayer(f,0,'HELLO','HELLO','HELLO','HELLO','NONE','NONE');
  myPlr.playTrack();
}

var playAlbum = function(tagId) {
  if (DEBUG) console.log('thePlayer playAlbum called ');

  // what to do when called without a tagId
  if (!tagId) {
    var responseJson = {
      response: 'Error',
      message: 'No Tag Id provided',
      status: 400,
      status_text: '400 - client error'
    };
    console.error(responseJson);
    return reject(responseJson);
  }

  var httpParams = {
    protocol: tagDbServiceProtocol + ':',
    host: tagDbServiceHost,
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
    // from here on we provide the data for the response object
    var playerStet = {
      tagId: obj.tagId,
      trackId: obj.trackId,
      albumName: obj.mediaTitle,
      trackName: obj.trackName,
      file: obj.trackPath,
      lastPosition: obj.lastPosition,
      playCount: obj.playCount,
      trackNo: obj.trackNo,
      diskNo: obj.diskNo,
      nextTrackId: obj.nextTrackId,
      prevTrackId: obj.prevTrackId
    };
    var responseJson = {
      response: 'info',
      message: 'Spiele '+obj.trackName + ' aus ' + obj.mediaTitle,
      status: 200,
      status_text: '200 - ok',
      playerData: playerState
    };
  }).then(function(body) {
    console.log(body);
    // play the requested file
    var f = path.join(mediaDir,obj.tagId,obj.trackPath);
    if (TRACE) console.log(' file to play: ' + f);
    var myPlr = new thePlayer(f,lastPosition,trackId,trackName,tagId,albumName,nextTrackId,prevTrackId);
    myPlr.playTrack();
  });
}

var playFile = function(file) {
  if (DEBUG) console.log('thePlayer playFile called ');

  // what to do when called without a tagId
  if (!file) {
    var responseJson = {
      response: 'Error',
      message: 'No file to play provided',
      status: 400,
      status_text: '400 - client error'
    };
    console.error(responseJson);
    return reject(responseJson);
  }

  // play the requested file
  var f = path.join(file);
  if (TRACE) console.log(' file to play: ' + f);
  var myPlr = new thePlayer(f,0,'HELLO','HELLO','HELLO','NONE','NONE');
  myPlr.playTrack();
}

var rewind = function(seconds) {
  if (!seconds) seconds = 5;
  if (DEBUG) console.log('thePlayer rewind called - rewinding for ' + seconds + ' seconds');

}

var fastForward = function(app, seconds) {
  if (!seconds) seconds = 5;
  if (DEBUG) console.log('thePlayer fastForward called - forwarding for ' + seconds + ' seconds');

}

var clear = function(app) {
  if (DEBUG) console.log('thePlayer clear called - clearing state of player');
}

var updatePosition = function(app) {
  if (DEBUG) console.log('thePlayer updatePosition called ');
}

var getPosition = function(app) {
  if (DEBUG) console.log('thePlayer getPosition called ');
}

var quit = function() {
  if (DEBUG) console.log('thePlayer quit called ');
}

var stop = function() {
  if (DEBUG) console.log('thePlayer stop called ');
}

var togglePause = function() {
  if (DEBUG) console.log('thePlayer togglePause called ');
  if (false) {
    if (TRACE) console.log('   resuming');
    // resume playback
  } else {
    if (TRACE) console.log('   pausing');
    // update position and pause player
  }
}

var volumeDown = function(volumeFactor) {
  if (!volumeFactor) volumeFactor = 5;
  if (DEBUG) console.log('thePlayer volumeDown called - reducing volume by ' + volumeFactor);
}

var volumeUp = function(volumeFactor) {
  if (!volumeFactor) volumeFactor = 5;
  if (DEBUG) console.log('thePlayer volumeUp called - increasing volume by ' + volumeFactor);
}

module.exports = {
  getEndpoints: getEndpoints,
  init: instantiatePlayer,
  play: playFile,
  playAlbum: playAlbum,
  stop: stop,
  pause: togglePause,
  forward: fastForward,
  rewind: rewind,
  position: getPosition,
  volumeUp: volumeUp,
  volumeDown: volumeDown
};
