var fs = require('fs');
var path = require('path');
var jsonfile = require('jsonfile');

// the player itself
console.log('calling thePlayer')
var thePlayer = require('../modules/thePlayer.js');
var config = require('../modules/configuration.js');

// the REST API for the tags db - this is where we get
// information on tags (usually by issueing a GET to the API tags/tag/:ID) from
const tagDbServiceProto = config.tagDbEndpoint.Protool;
const tagDbServiceAddr = config.tagDbEndpoint.Hostname;
const tagDbServicePort = Number(config.tagDbEndpoint.Port);
const tagDbServiceApi = config.tagDbEndpoint.Api;
const tagDbServiceUrl = config.tagDbEndpoint.Url;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

const soundDir = config.directories.SoundDir;
const mediaDir = config.directories.MediaDir;
const tagDB = config.directories.TagDB;

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


var instantiatePlayer = function(plr) {
  var f = soundDir + '/' + 'hello.mp3';
  if (DEBUG) console.log('instantiating new player with welcome sound ' + f);
  var myPlrStatus = new theOuterPlayer(f, 0);
  var myPlr = new thePlayer(f, 0);
  myPlr.playTrack();
}

var playTrack = function(plr, tagId) {
  if (DEBUG) console.log('thePlayer playTrack called ');

  // define the promise that we'll return when everything works out
  return new Promise(function(resolve, reject){
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

    // if ok, we'll return the resolve
    if (DEBUG) console.log('sending http request to tagDbService REST api for tag ' + tagId);
    // define the service endpoint to get track data for a tag
    var options = {
      protocol: tagDbServiceProto + ':',
      host: tagDbServiceAddr,
      port: Number(tagDbServicePort),
      path: tagDbServiceApi+tagDbServiceUrl+'/playdata/' + tagId,
      family: 4,
      headers: {'User-Agent': 'request', 'Content-Type': 'application/json', 'Accept': 'application/json'},
      method: 'GET'
    };
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

        // play the requested file
        var f = path.join(mediaDir,obj.tagId,obj.trackPath);
        if (TRACE) console.log(' file to play: ' + f);
        // first set the state of our wrapper status-class
        myPlrStatus.setState(obj);
        // now we may set the file to play
        myPlr.state.filename = f;
        // and the last position within the file
        myPlr.state.position = obj.lastPosition;
        // and of course start the playback
        myPlr.playTrack();

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
      });
    }).on('error', function(e){
      var errObj = e;
      var responseJson = {
        response: 'Error',
        message: 'Could not retrieve data for tag ' + tagId,
        status: '500 - internal server error',
        http_code: '500',
        error: errObj
      };
      console.error(responseJson);
      return reject(responseJson);
    }).end();

    // in case of error or some other impediment preventing us from resolving,
    // return the reject
    if (err) return reject(err);
  })
}

var rewind = function(plr, seconds) {
  if (!seconds) seconds = 5;
  if (DEBUG) console.log('thePlayer rewind called - rewinding for ' + seconds + ' seconds');

}

var fastForward = function(plr, seconds) {
  if (!seconds) seconds = 5;
  if (DEBUG) console.log('thePlayer fastForward called - forwarding for ' + seconds + ' seconds');

}

var clear = function(plr) {
  if (DEBUG) console.log('thePlayer clear called - clearing state of player');
}

var updatePosition = function(plr) {
  if (DEBUG) console.log('thePlayer updatePosition called ');
}

var getPosition = function(plr) {
  if (DEBUG) console.log('thePlayer getPosition called ');
}

var quit = function(plr) {
  if (DEBUG) console.log('thePlayer quit called ');
}

var stop = function(plr) {
  if (DEBUG) console.log('thePlayer stop called ');
}

var togglePause = function() {
  if (DEBUG) console.log('thePlayer togglePause called ');
  if (false) {
    // resume playback
  } else {
    // update position and pause player
  }
}

var volumeDown = function(plr, volumeFactor) {
  if (!volumeFactor) volumeFactor = 5;
  if (DEBUG) console.log('thePlayer volumeDown called - reducing volume by ' + volumeFactor);
}

var volumeUp = function(plr, volumeFactor) {
  if (!volumeFactor) volumeFactor = 5;
  if (DEBUG) console.log('thePlayer volumeUp called - increasing volume by ' + volumeFactor);
}

module.exports = {
  init: instantiatePlayer,
  play: playTrack
}
