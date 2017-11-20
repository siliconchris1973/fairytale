// this is needed for the file upload to dir and checking for magic number prior upload
var path = require('path');
var fs = require('fs');
var multer = require('multer');

var cmd = require('node-cmd');
var async = require('async');
var jsonfile = require('jsonfile');


// this is where we store the uploaded files, prior resizing and moving to final directory
// final directory is /data/Cover/icon .../small .../normal
var targetTmpDir  = './data/Cover/tmp';
var targetIconDir  = './data/Cover/icon';
var targetSmallDir  = './data/Cover/small';
var targetNormalDir  = './data/Cover/normal';


var MAGIC_NUMBERS = {
    jpg: 'ffd8ffe0',
    jpg1: 'ffd8ffe1',
    png: '89504e47',
    gif: '47494638'
}

// check file type according to magic number
function checkMagicNumbers(magic) {
  if (magic == MAGIC_NUMBERS.jpg || magic == MAGIC_NUMBERS.jpg1 || magic == MAGIC_NUMBERS.png || magic == MAGIC_NUMBERS.gif) return true
}


var fileupload = function(app, req, res){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  var svrProto = app.get('svrProto');
  var svrAddr = app.get('svrAddr');
  var svrPort = app.get('svrPort');
  var svrApi = app.get('svrApi');


  if (DEBUG) console.log('function fileupload called');
  if (TRACE) console.log("   req: ",req.files);
  var filesArray = req.files;
  async.each(filesArray,function(file,eachcallback){
    async.waterfall([
      function (callback) {
        fs.readFile(file.path, (err, data) => {
          if (err) {
            console.error("error: error ocurred with file ", err);
          } else {
            callback(null,data);
          }
        });
      },
      function (data, callback) {
        fs.writeFile(targetNormalDir  + file.originalname, data, (err) => {
          if (err) {
            console.error("error: error ocurred with file ", err);
          } else {
            callback(null, 'success');
          }
        });
      },
      function (arg1, callback) {
        var filepath = './userdata/userid.json'
        jsonfile.readFile(filepath, function(err, obj) {
          callback(null,'done')
        })
      }
    ], function (err, result) {
      // result now equals 'done'
      //pass final callback to async each to move on to next file
      eachcallback();
    });
  },function(err){
    if(err){
        console.error("error: error ocurred in each ",err);
    }
    else{
      console.log("finished prcessing");
      res.send({
                "code":"200",
                "success":"files printed successfully"
                })
      cmd.run('rm -rf '+targetTmpDir+'/*');
    }
  });
}

module.exports = {
  fileupload: fileupload
}
