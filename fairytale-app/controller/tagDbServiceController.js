var fs = require('fs');
var path = require('path');
var jsonfile = require('jsonfile');
var http = require('http');
var request = require('request');

var config = require('../modules/configuration.js');

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
const fileServiceHelphUri = config.fileServiceEndpoint.HelpUri;
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
var rfidTagDir = tagDB;

// this is a synchronous function that returns all the endpoints.
var getEndpoints = function(app) {
  if (DEBUG) console.log('getEndpoints called');
  const theEndpoints = {
    endpoints: [
      {
        AppName: 'endpoints',
        endpoint: tagDbServiceProtocol + '://' + tagDbServiceHost+':'+tagDbServicePort+tagDbServiceApi+tagDbServiceUrl+'/endpoints',
        method: 'GET',
        description: 'Endpoints of the tagDbService API',
        alive: 'true'
      },
      {
        AppName: 'help',
        endpoint: tagDbServiceProtocol + '://' + tagDbServiceHost+':'+tagDbServicePort+tagDbServiceApi+tagDbServiceUrl+tagDbServiceHelpUri,
        method: 'GET',
        description: 'Get Help',
        alive: 'false'
      },
      {
        AppName: 'health',
        endpoint: tagDbServiceProtocol + '://' + tagDbServiceHost+':'+tagDbServicePort+tagDbServiceApi+tagDbServiceUrl+tagDbServiceHealthUri,
        method: 'GET',
        description: 'Health status interface',
        alive: 'false'
      },
      {
        AppName: 'tags',
        endpoint: tagDbServiceProtocol + '://' + tagDbServiceHost+':'+tagDbServicePort+tagDbServiceApi+tagDbServiceUrl,
        method: 'GET',
        description: 'List of available tags',
        alive: 'true'
      },
      {
        AppName: 'tag',
        endpoint: tagDbServiceProtocol + '://' + tagDbServiceHost+':'+tagDbServicePort+tagDbServiceApi+tagDbServiceUrl+'/tag/:id',
        method: 'GET',
        description: 'A specific tag',
        alive: 'true'
      },
      {
        AppName: 'tag',
        endpoint: tagDbServiceProtocol + '://' + tagDbServiceHost+':'+tagDbServicePort+tagDbServiceApi+tagDbServiceUrl+'/tag/:id',
        method: 'POST',
        description: 'POST API to create new tag',
        alive: 'true'
      },
      {
        AppName: 'create',
        endpoint: tagDbServiceProtocol + '://' + tagDbServiceHost+':'+tagDbServicePort+tagDbServiceApi+tagDbServiceUrl+'/tag/create',
        method: 'GET',
        description: 'Form to create new tag',
        alive: 'true'
      }
    ]
  };
  return theEndpoints;
};


// asynchronous promised function to get a list of tags, together with
// media title and meta data like number of disks, tracks etc.
var getTagList = function(app){
  return new Promise(function(resolve, reject){
    if (DEBUG) console.log('function getTagList called');

    

  })
}

var getTagData = function(app, tagId , callback){
  if (DEBUG) console.log('function getTagData called');

  var obj = null;
  var tagStorage = path.join(rfidTagDir, tagId .toUpperCase()+'.json');

  try {
    jsonfile.readFile(tagStorage, function(err, result) {
      if (err) {
        console.error('error: error getting data of tag '+tagId+' from '+rfidTagDir+' \nerror message: ' +err.toString());
        var errCallback = {
          response: 'error',
          message: 'error getting data of tag '+tagId+' from '+rfidTagDir,
          error: err.toString()
        };
        callback(errCallback);
      } else {
        if (DEBUG) console.log('getting data for tag ' + tagId  + ' from file ' + tagStorage +':');
        if (TRACE) console.log(result);
        callback(null, result)
      }
    })
  } catch (ex) {
    console.error('error: reading json file for tag '+tagId+' from '+tagStorage+' failed \nerror message: ' +ex.toString());
    var errCallback = {
      response: 'error',
      message: 'could not read data for tag '+tagId +' from '+tagStorage,
      error: ex.toString()
    };
    callback(errCallback);
  }
}

var getTagToPlay = function(app, tagId , callback){
  if (DEBUG) console.log('function getTagData called');

  var obj = null;
  var tagStorage = path.join(rfidTagDir, tagId .toUpperCase()+'.json');

  try {
    jsonfile.readFile(tagStorage, function(err, result) {
      if (err) {
        console.error('error: error getting data of tag '+tagId+' from '+rfidTagDir+' \nerror message: ' +err.toString());
        var errCallback = {
          response: 'error',
          message: 'error getting data of tag '+tagId+' from '+rfidTagDir,
          error: err.toString()
        };
        callback(errCallback);
      } else {
        if (DEBUG) console.log('getting data for tag ' + tagId  + ' from file ' + tagStorage +':');
        if (TRACE) console.log(result);
        var obj = result;

        var trackId = 'UNDEF';
        var trackName = 'UNDEF';
        var trackPath = 'UNDEF';
        var lastPosition = 'UNDEF';
        var playCount = 'UNDEF';
        var lastTrack = obj.lastTrack;
        var subStrDiskTrack = lastTrack.substring(lastTrack.indexOf(':')+1);
        var diskNo = subStrDiskTrack.substring(1,subStrDiskTrack.indexOf(':'));
        var trackNo = subStrDiskTrack.substring(subStrDiskTrack.indexOf(':')+2);
        var nextTrackId = 'NONE';
        var prevTrackId = 'NONE';
        if (trackId === 'UNDEF') trackId = lastTrack;

        if (TRACE) console.log('Getting data for track ' + trackId);
        // these vars will hold the next and the previos track to play, if any
        var counter = 0;
        for (i in obj.MediaFiles) {
          counter++;
          if (obj.MediaFiles[i].id == trackId) {
            if (TRACE) console.log('currently / last played track as ' + trackId);
            trackName = obj.MediaFiles[i].name;
            trackPath = obj.MediaFiles[i].path;
            lastPosition = obj.MediaFiles[i].lastposition;
            playCount = obj.MediaFiles[i].playcount;
          }
        }
        // check if there is a next file to play
        if (nextTrackId == 'NONE' && trackNo < obj.MediaFiles.length) {
          if (TRACE) console.log('putting next track into var');
          nextTrackId = tagId+':d'+diskNo+':t'+(Number(trackNo)+1)
        }
        // check if there is a next file to play
        if (prevTrackId == 'NONE' && trackNo > 1) {
          if (TRACE) console.log('putting previous track into var');
          prevTrackId = tagId+':d'+diskNo+':t'+(Number(trackNo)-1)
        }
        var response = {
          tagId: tagId,
          trackId: trackId,
          trackNo: trackNo,
          diskNo: diskNo,
          mediaTitle: obj.MediaTitle,
          trackName: trackName,
          trackPath: trackPath,
          lastPosition: lastPosition,
          playCount: playCount,
          prevTrackId: prevTrackId,
          nextTrackId: nextTrackId
        };
        var respObj = response;
        callback(null, respObj)
      }
    })
  } catch (ex) {
    console.error('error: reading json file for tag '+tagId+' from '+tagStorage+' failed \nerror message: ' +ex.toString());
    var errCallback = {
      response: 'error',
      message: 'could not read data for tag '+tagId +' from '+tagStorage,
      error: ex.toString()
    };
    callback(errCallback);
  }
}


var addPictureData = function(app, tagId , picture, callback){
  if (DEBUG) console.log('function addPictureData called');

  var obj = null;

  // set the picture number to 0 as an indicator if there are any pictures already
  var picNumber = 0;
  if (DEBUG) console.log('trying to get data for tag ' + tagId + ' to add new picture ('+picture+') to the meta data');
  getTagData(app, tagId, function(err, result) {
    if (err) {
      console.error('error: could not read data for tag ' + tagId +' - ' + err.toString());
      var errCallback = {
        response: 'error',
        message: 'could not read data for tag '+tagId +' from '+tagStorage,
        error: err.toString()
      };
      callback(errCallback);
    } else {
      var obj = result
      var picObj = obj.MediaPicture
      if (TRACE) console.log(picObj);

      // this returns the next number for an array of oobjects (parts or pics)
      function getNextNumber(arr, prop) {
        var max;
        for (var i=0 ; i<arr.length ; i++) {
            if (!max || parseInt(arr[i][prop]) > parseInt(max[prop]))
                max = arr[i][prop];
        }
        return Number(max)+1;
      }
      picNumber = getNextNumber(picObj, "pic");
      if (DEBUG) console.log('new picture number is ' + picNumber);

      var myObj = { 'pic':picNumber.toString(), 'name': picture};
      var myJSON = JSON.stringify(myObj);

      obj['MediaPicture'].push(myObj);

      //jsonStr = JSON.stringify(obj);
      jsonStr = JSON.stringify(obj);
      if (TRACE) console.log('This is the created json:\n' + jsonStr);

      // now we are exchanging the former jsonfile with the new content
      if (DEBUG) console.log('calling writeTagData to write new json content to disk');
      var response = writeTagDataSync(app, tagId, jsonStr);

      callback(null, obj);
    }
  });
}



module.exports = {
  getEndpoints: getEndpoints,
  getTagList: getTagList,
  getTagData: getTagData,
  getTagToPlay: getTagToPlay,
  addPictureData: addPictureData
}
