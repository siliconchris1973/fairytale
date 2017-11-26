var fs = require('fs');
var path = require('path');
var jsonfile = require('jsonfile');
var http = require('http');
var request = require('request');

var config = require('../modules/configuration.js');

// CONFIG data on the RFID/NFC Tag DB Service
const svrAppName = config.tagDbServiceEndpoint.AppName;
const svrProtocol = config.tagDbServiceEndpoint.Protocol;
const svrHost = config.tagDbServiceEndpoint.Host;
const svrPort = Number(config.tagDbServiceEndpoint.Port);
const svrApi = config.tagDbServiceEndpoint.Api;
const svrUrl = config.tagDbServiceEndpoint.Url;
const svrHealthUri = config.tagDbServiceEndpoint.HealthUri;
const svrWelcomeUri = config.tagDbServiceEndpoint.WelcomeUri;
const svrHelpUri = config.tagDbServiceEndpoint.HelpUri;
const svrInfoUri = config.tagDbServiceEndpoint.InfoUri;
const svrStatusUri = config.tagDbServiceEndpoint.StatusUri;
const svrEndpointsUri = config.tagDbServiceEndpoint.EndpointsUri;
const svrDescription = config.tagDbServiceEndpoint.Description;
const svrFullUrl = svrProtocol + '://'+svrHost+':'+svrPort+svrApi+svrUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

const soundDir = config.directories.SoundDir;
const mediaDir = config.directories.MediaDir;
const tagDB = config.directories.TagDB;

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
        AppName: 'tags',
        endpoint: svrFullUrl,
        method: 'GET',
        description: 'List of available tags',
        alive: 'true'
      },
      {
        AppName: 'tag',
        endpoint: svrFullUrl+'/tag/:id',
        method: 'GET',
        description: 'A specific tag',
        alive: 'true'
      },
      {
        AppName: 'tag',
        endpoint: svrFullUrl+'/tag/:id',
        method: 'POST',
        description: 'POST API to create new tag',
        alive: 'true'
      },
      {
        AppName: 'create',
        endpoint: svrFullUrl+'/tag/create',
        method: 'GET',
        description: 'Form to create new tag',
        alive: 'true'
      }
    ]
  };
  return theEndpoints;
};

// inline function (promised) that provides a filename and it's content
function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      fs.readFile(dirname + filename, 'utf-8', function(err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content);
      });
    });
  });
}

// asynchronous promised function to get a list of tags, together with
// media title and meta data like number of disks, tracks etc.
var getTagList = function(){
  return new Promise(function(resolve, reject){
    if (DEBUG) console.log('function getTagList called');
    var data = {};
    readFiles(tagDB, function(filename, content) {
      if (path.extname(filename) == 'json') data[filename] = content;
      console.log(data);
      return(data);
    }, function(err) {
      throw err;
    });
  })
}
// synchronous function that returns the list of available tags
var getTagListSync = function(){
  if (DEBUG) console.log('function getTagListSync called');

  var glob = require("glob")

  // options is optional
  glob("**/*.json", options, function (err, files) {
    // files is an array of filenames.
    // If the `nonull` option is set, and nothing
    // was found, then files is ["**/*.js"]
    // er is an error object or null.
  })
  var obj = dirList;
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
}

var getTagData = function(tagId , callback){
  if (DEBUG) console.log('function getTagData called');

  var obj = null;
  var tagStorage = path.join(tagDb, tagId .toUpperCase()+'.json');

  try {
    jsonfile.readFile(tagStorage, function(err, result) {
      if (err) {
        console.error('error: error getting data of tag '+tagId+' from '+tagDb+' \nerror message: ' +err.toString());
        var errCallback = {
          response: 'error',
          message: 'error getting data of tag '+tagId+' from '+tagDb,
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

var getTagToPlay = function(tagId , callback){
  if (DEBUG) console.log('function getTagData called');

  var obj = null;
  var tagStorage = path.join(tagDb, tagId .toUpperCase()+'.json');

  try {
    jsonfile.readFile(tagStorage, function(err, result) {
      if (err) {
        console.error('error: error getting data of tag '+tagId+' from '+tagDb+' \nerror message: ' +err.toString());
        var errCallback = {
          response: 'error',
          message: 'error getting data of tag '+tagId+' from '+tagDb,
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


var addPictureData = function(tagId, picture, callback){
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
  getTagList: getTagListSync,
  //getTagList: getTagList,
  getTagData: getTagData,
  getTagToPlay: getTagToPlay,
  addPictureData: addPictureData
}
