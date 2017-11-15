  var fs = require('fs');
  var path = require('path');
  var jsonfile = require('jsonfile');

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
  var rfidTagDir = tagDB;

  // the player itself
  console.log('calling thePlayer')

  // the http call to the tagDb rest aüi wrapped in a promise
  function httpRequest(app, params, postData) {
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
              status: '500 - internal server error',
              http_code: '500',
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
          status: '500 - internal server error',
          http_code: '500',
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
    constructor (name, position, trackId, nextTrackId, prevTrackId) {
      if (DEBUG) console.log('thePlayer constructor called');
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
    }
    setState (stateConf) {
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
  }


  var instantiatePlayer = function(app) {
    const DEBUG = app.get('DEBUG');
    const TRACE = app.get('TRACE');

    const soundDir = app.get('SoundDir');
    const mediaDir = app.get('MediaDir');
    const tagDB = app.get('TagDB');

    var f = soundDir + '/' + 'hello.mp3';
    if (DEBUG) console.log('instantiating new player with welcome sound ' + f);
    var myPlrStatus = new theOuterPlayer(f, 0);
    var myPlr = new thePlayer(f, 0);
    myPlr.playTrack();
  }

  var playTrack = function(app, tagId) {
    const DEBUG = app.get('DEBUG');
    const TRACE = app.get('TRACE');

    if (DEBUG) console.log('thePlayer playTrack called ');
    /*
    // what to when called without a tagId
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

  var rewind = function(app, seconds) {
    const DEBUG = app.get('DEBUG');
    const TRACE = app.get('TRACE');

    const soundDir = app.get('SoundDir');
    const mediaDir = app.get('MediaDir');
    const tagDB = app.get('TagDB');

    if (!seconds) seconds = 5;
    if (DEBUG) console.log('thePlayer rewind called - rewinding for ' + seconds + ' seconds');

  }

  var fastForward = function(app, seconds) {
    const DEBUG = app.get('DEBUG');
    const TRACE = app.get('TRACE');

    const soundDir = app.get('SoundDir');
    const mediaDir = app.get('MediaDir');
    const tagDB = app.get('TagDB');

    if (!seconds) seconds = 5;
    if (DEBUG) console.log('thePlayer fastForward called - forwarding for ' + seconds + ' seconds');

  }

  var clear = function(app) {
    const DEBUG = app.get('DEBUG');
    const TRACE = app.get('TRACE');

    const soundDir = app.get('SoundDir');
    const mediaDir = app.get('MediaDir');
    const tagDB = app.get('TagDB');

    if (DEBUG) console.log('thePlayer clear called - clearing state of player');
  }

  var updatePosition = function(app) {
    const DEBUG = app.get('DEBUG');
    const TRACE = app.get('TRACE');

    const soundDir = app.get('SoundDir');
    const mediaDir = app.get('MediaDir');
    const tagDB = app.get('TagDB');

    if (DEBUG) console.log('thePlayer updatePosition called ');
  }

  var getPosition = function(app) {
    const DEBUG = app.get('DEBUG');
    const TRACE = app.get('TRACE');

    const soundDir = app.get('SoundDir');
    const mediaDir = app.get('MediaDir');
    const tagDB = app.get('TagDB');

    if (DEBUG) console.log('thePlayer getPosition called ');
  }

  var quit = function() {
    const DEBUG = app.get('DEBUG');
    const TRACE = app.get('TRACE');

    const soundDir = app.get('SoundDir');
    const mediaDir = app.get('MediaDir');
    const tagDB = app.get('TagDB');

    if (DEBUG) console.log('thePlayer quit called ');
  }

  var stop = function() {
    const DEBUG = app.get('DEBUG');
    const TRACE = app.get('TRACE');
    if (DEBUG) console.log('thePlayer stop called ');
  }

  var togglePause = function() {
    const DEBUG = app.get('DEBUG');
    const TRACE = app.get('TRACE');
    if (DEBUG) console.log('thePlayer togglePause called ');
    if (false) {
      // resume playback
    } else {
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
  init: instantiatePlayer,
  play: playTrack,
  stop: stop,
  pause: togglePause
};
