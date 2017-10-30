var fs = require('fs');
var path = require('path');
var jsonfile = require('jsonfile');
var http = require('http');

var request = require('request');

var multer = require('multer');

var upload = require('./fileUpload.js');

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


var getTagDataSync = function(app, tagId){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  // this is the path to the file system where the rfid tags are stored
  var rfidTagDir = app.get('rfidTagDir');
  var obj = null;

  if (DEBUG) console.log('function getTagData called');

  var tagStorage = path.join(rfidTagDir, tagId .toUpperCase()+'.json');

  try {
    var obj = jsonfile.readFileSync(tagStorage, 'utf8')
    if (DEBUG) console.log('getting data for tag ' + tagId  + ' from file ' + tagStorage +':');
    if (TRACE) console.log(obj);
    return(obj);
  } catch (ex) {
    console.error('error: reading json file for tag '+tagId+' from '+tagStorage+' failed \nerror message: ' +ex.toString());
    var errCallback = {
      response: 'error',
      message: 'could not read data for tag '+tagId +' from '+tagStorage,
      error: ex.toString()
    };
    return(errCallback);
  }
}

var writeTagDataSync = function(app, tagId, content){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  var rfidTagDir = app.get('rfidTagDir');
  var obj = JSON.parse(content);

  if (DEBUG) console.log('function writeTagData called');
  if (TRACE) console.log('tagId:   ' + tagId);
  if (TRACE) console.log('content: ' + content);
  if (TRACE) console.log('obj:     ' + obj);

  var tagStorage = path.join(rfidTagDir, tagId .toUpperCase()+'.json');

  try {
    jsonfile.writeFileSync(tagStorage, obj, {spaces: 2});
  } catch (ex) {
    console.error('error: could not write data for tag ' + tagId + ' to file ' + tagStorage + ' - exception: ' + ex.toString());
    var errCallback = {
      response: 'error',
      message: 'could not write data for tag '+tagId +' to '+tagStorage,
      error: ex.toString()
    };
    return(errCallback);
  }
  console.log('success: data for tag '+tagId+' written to file ' + tagStorage);
  var respCallback = {
    reponse: 'success',
    message: 'data for tag ' + tagId + ' written to file ' + tagStorage
  };
  return(respCallback);
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
  addPictureData: addPictureData,
  uploadFile: uploadFile
}
