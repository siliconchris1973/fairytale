var fs = require('fs');
var path = require('path');
var jsonfile = require('jsonfile');
var http = require('http');
var request = require('request');
var multer = require('multer');
var upload = require('../modules/fileUpload.js');

var getTagList = function(app, callback){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  var svrProto = app.get('svrProto');
  var svrAddr = app.get('svrAddr');
  var svrPort = app.get('svrPort');
  var svrApi = app.get('svrApi');

  var rfidTagDir = app.get('rfidTagDir');

  if (DEBUG) console.log('function getTagList called');

  try {
    fs.readdir(rfidTagDir, function(err, items) {
      if (DEBUG) console.log('working on directory ' + rfidTagDir);

      if (err) {
        // irgendein Fehler beim einlesen des Verzeichnisses
        console.error("error: error occured trying to read directory "+rfidTagDir + '\n   error message: ' + err.toString());
        var errCallback = {
          response: 'error',
          message: 'error getting files from directory ' + rfidTagDir,
          error: err.toString()
        };

        callback(errCallback);
      } else if (!items.length) {
        // directory appears to be empty
        console.warn("warning: nothing to read in directory "+rfidTagDir);
        var errCallback = {
          response: 'warning',
          message: 'nothing to read from directory '+rfidTagDir
        };

        callback(errCallback);
      } else {
        // im Verzeichnis sind tatsaechlich Dateien
        if (DEBUG) console.log('Anzahl Elemente im Verzeichnis '+rfidTagDir+': ' + items.length);

        var tagItemArray = [];

        for (i in items) {
          if (items[i].toString().substr(items[i].indexOf('.')) == '.json') {
            if (DEBUG) console.log('Arbeite auf item ' + items[i]);
            var dirItem = '';

            // tag-id auslesen, da wir sie gleich brauchen
            var tag = items[i].toString().toUpperCase().substring(0,items[i].indexOf('.'));
            dirItem = {
              tag: tag,
              endpoint: svrProto+'://'+svrAddr+':'+svrPort+svrApi+'/tags/tag/'+tag,
              file: items[i]
            };

            tagItemArray.push(dirItem);
          } else {
            if (DEBUG) console.log('ignoring file ' + items[i] + ' as it is not a json file');
          }
        }
      }
      if (DEBUG) console.log('taglist ready, providing via callback');
      var respCallback = {
        tags: tagItemArray
      };
      if (TRACE) console.log(respCallback);
      callback(null, respCallback);
    });
  } catch (ex) {
    console.error("could not read directory "+rfidTagDir+" to list available tags \nException output: " + err.toString());
    var errCallback = {
      response: 'error',
      message: 'could not read tags from directory ' + rfidTagDir,
      error: ex.toString()
    };
    callback(errCallback);
  }
}

var checkTagExist = function(app, tagFile, callback){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  if (DEBUG) console.log('function checkTagExist called for tag ' + tagFile);

  try {
    fs.readFileSync(tagFile, function(err, result) {
      if (err) {
        callback(false);
      } else {
        callback(true)
      }
    })
  } catch (ex) {
    callback(false);
  }
}

var getMediaList = function(app, callback){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  var svrProto = app.get('svrProto');
  var svrAddr = app.get('svrAddr');
  var svrPort = app.get('svrPort');
  var svrApi = app.get('svrApi');

  var rfidTagDir = app.get('rfidTagDir');

  if (DEBUG) console.log('function getTagList called');

  var responseContent = '';

  try {
    fs.readdir(rfidTagDir, function(err, items) {
      if (DEBUG) console.log('working on directory ' + rfidTagDir);

      if (err) {
        // irgendein Fehler beim einlesen des Verzeichnisses
        console.error("error: error occured trying to read directory "+rfidTagDir + '\n   error message: ' + err.toString());
        var errCallback = {
          response: 'error',
          message: 'error getting files from directory ' + rfidTagDir,
          error: err.toString()
        };

        callback(errCallback);
      } else if (!items.length) {
        // directory appears to be empty
        console.warn("warning: nothing to read in directory "+rfidTagDir);
        var errCallback = {
          response: 'warning',
          message: 'nothing to read from directory '+rfidTagDir
        };

        callback(errCallback);
      } else {
        // im Verzeichnis sind tatsaechlich Dateien
        if (DEBUG) console.log('Anzahl Elemente im Verzeichnis '+rfidTagDir+': ' + items.length);
        responseContent = "{\'tags\': ["

        //var respCallback = { tags: []};
        var tagItemArray = [];

        for (i in items) {
          if (items[i].toString().substr(items[i].indexOf('.')) == '.json') {
            if (DEBUG) console.log('Arbeite auf item ' + items[i]);
            var dirItem = '';

            // tag-id auslesen, da wir sie gleich brauchen
            var tag = items[i].toString().toUpperCase().substring(0,items[i].indexOf('.'));

            getTagData(app, tag, function(err, result){
              if (err) {
                console.error('error: could not retrieve tag data for tag ' + tag);
                /*
                dirItem = {
                  tag: tag,
                  endpoint: svrProto+'://'+svrAddr+':'+svrPort+svrApi+'/tags/tag/'+tag,
                  title: 'no tag info - error: ' + err.toString()
                };
                */
              } else {
                if (DEBUG) console.log('data for tag ' + tag + ' retrieved')
                if (TRACE) console.log(dirItem);

                var obj = result;

                dirItem = {
                  tag: tag,
                  endpoint: svrProto+'://'+svrAddr+':'+svrPort+svrApi+'/tags/tag/'+tag,
                  title: obj.MediaTitle,
                  genre: obj.MediaGenre,
                  type: obj.MediaType,
                  disks: obj.DiskCount,
                  tracks: obj.TrackCount
                };
                tagItemArray.push(dirItem);
              }
            });

            //tagItemArray.push(dirItem);

            // we only need to add the , after an array element in the json
            // structure, if there are sukzessive elements.
            if (i<items.length-1) responseContent += ",";
          } else {
            if (DEBUG) console.log('ignoring file ' + items[i] + ' as it is not a json file');
          }
        }
        responseContent += "]}"
      }
      if (DEBUG) console.log('taglist ready, providing via callback');
      var respCallback = {
        tags: tagItemArray
      };
      if (TRACE) console.log(respCallback);
      callback(null, respCallback);
    });
  } catch (ex) {
    console.error("could not read directory "+rfidTagDir+" to list available tags \nException output: " + err.toString());
    var errCallback = {
      response: 'error',
      message: 'could not read tags from directory ' + rfidTagDir,
      error: ex.toString()
    };
    callback(errCallback);
  }
}

var getTagData = function(app, tagId , callback){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  var svrProto = app.get('svrProto');
  var svrAddr = app.get('svrAddr');
  var svrPort = app.get('svrPort');
  var svrApi = app.get('svrApi');

  // this is the path to the file system where the rfid tags are stored
  var rfidTagDir = app.get('rfidTagDir');
  var obj = null;

  if (DEBUG) console.log('function getTagData called');

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
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  var svrProto = app.get('svrProto');
  var svrAddr = app.get('svrAddr');
  var svrPort = app.get('svrPort');
  var svrApi = app.get('svrApi');

  // this is the path to the file system where the rfid tags are stored
  var rfidTagDir = app.get('rfidTagDir');
  var obj = null;

  if (DEBUG) console.log('function getTagData called');

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

var writeTagDataSync = function(app, tagId, content){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  var rfidTagDir = app.get('rfidTagDir');
  var obj = JSON.parse(content);

  if (DEBUG) console.log('function writeTagDataSync called');
  if (TRACE) console.log('tagId:   ' + tagId);
  if (TRACE) console.log('content: ' + content);
  if (TRACE) console.log('obj:     ' + obj);

  var tagStorage = path.join(rfidTagDir, tagId .toUpperCase()+'.json');

  jsonfile.readFile(tagStorage, function(err, result) {
    if (err) {
      console.error('error: error getting data of tag '+tagId+' from '+rfidTagDir+' \nerror message: ' +err.toString());
    } else {
      if (DEBUG) console.log('getting data for tag ' + tagId  + ' from file ' + tagStorage +':');

      var diskObj = result;
      if (obj.hasOwnProperty('lastTrack')) {
        if (DEBUG) console.log('got a lastTrack information ' + obj.lastTrack)
        diskObj.lastTrack = obj.lastTrack;
      }
      if (obj.hasOwnProperty('position')) {
        if (DEBUG) console.log('got a position information ' + obj.position)
        for (i in diskObj.MediaFiles) {
          if (diskObj.MediaFiles[i].id == lastTrack) {
            diskObj.MediaFiles[i].lastposition = obj.position;
          }
        }
      }
      if (TRACE) console.log('this is the new json that is gonna written to disk:');
      if (TRACE) console.log(diskObj);
      /*
      try {
        jsonfile.writeFileSync(tagStorage, diskObj, {spaces: 2});
      } catch (ex) {
        console.error('error: could not write data for tag ' + tagId + ' to file ' + tagStorage + ' - exception: ' + ex.toString());
      }
      */
      console.log('success: data for tag '+tagId+' written to file ' + tagStorage);
    }
  });
}

var addPictureData = function(app, tagId , picture, callback){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  var svrProto = app.get('svrProto');
  var svrAddr = app.get('svrAddr');
  var svrPort = app.get('svrPort');
  var svrApi = app.get('svrApi');

  var rfidTagDir = app.get('rfidTagDir');
  var obj = null;

  if (DEBUG) console.log('function addPictureData called');

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

var uploadFile = function(app, file, callback) {
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');
  if (DEBUG) console.log('proxy function uploadFile called');
  if (TRACE) console.log('   file to post: '+file.toString());

  var svrProto = app.get('svrProto');
  var svrAddr = app.get('svrAddr');
  var svrPort = app.get('svrPort');
  var svrApi = app.get('svrApi');

  // we need these to work with the second node.js service fileService, which
  // does the actual file handling
  var fileServiceProto = app.get('fileServiceProto')+':';
  var fileServiceAddr = app.get('fileServiceAddr');
  var fileServicePort = app.get('fileServicePort');
  var fileServiceApi = app.get('fileServiceApi');
  var fileServiceUrl = app.get('fileServiceUrl');

  try {
    var url = fileServiceProto+'//'+fileServiceAddr+':'+fileServicePort+fileServiceApi+fileServiceUrl;
    var options = {
      protocol: fileServiceProto,
      host: fileServiceAddr,
      port: Number(fileServicePort),
      path: fileServiceApi+fileServiceUrl,
      family: 4,
      headers: {'User-Agent': 'request', 'Content-Type': 'application/json', 'Accept': 'application/json'},
      multipart: [{
        body: '<FILE_DATA>'
      }],
      method: 'POST'
    };
    if (DEBUG) console.log('sending http request to fileService REST api');
    if (TRACE) console.log(options);

    http.request(options, function(res) {
      if (DEBUG) console.log('STATUS: ' + res.statusCode);
      if (TRACE) console.log('HEADERS: ' + JSON.stringify(res.headers));
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        if (TRACE) console.log('BODY: ' + chunk);
      });
    }).end();
    callback(null, chunk);

  } catch (ex) {
    console.error('error: exception while uploading the file \''+picture+'\'\n   exception text: ' + ex.toString());
    var errCallback = {
      reponse: error,
      message: 'exception while uploading file ' + picture,
      error: ex.toString()
    };
    callback(errCallback);
  }

}

module.exports = {
  getTagList: getTagList,
  getTagData: getTagData,
  getTagToPlay: getTagToPlay,
  addPictureData: addPictureData,
  uploadFile: uploadFile
}
