const express = require('express'),
  app = express();

// this is needed for the file upload to dir and checking for magic number prior upload
var path = require('path');
var fs = require('fs');
var multer = require('multer');
var os = require('os');

// using ejs for the view engine
var ejs = require('ejs')
app.set('view engine', 'ejs')

// how do we handle requests and parse the request body
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// these set static exposures for media files and pictures and such
app.use(express.static('static'));
app.use(express.static('../data'));
app.use(express.static('modules'));

// these set static exposures for media files and pictures and such
app.use(express.static(path.resolve('./static')));
app.use(express.static(path.resolve('./modules')));
app.use(express.static(path.resolve('./views')));
app.use(express.static(path.resolve('./data')));
// access to static content, the media and tag files
app.set('/img', express.static(path.resolve('./static/img')));
app.set('/sounds', express.static(path.resolve('./static/sounds')));
app.set('/Media', express.static(path.resolve('../data/Media')));
app.set('/TagDB', express.static(path.resolve('../data/TagDB')));


// get the global configuration
const config = require('./modules/configuration.js');

// these settings are made available via app.get('variable name')
// from within all subsequent scripts
// a rather ugly global DEBUG switch
app.set('DEBUG', config.debugging.DEBUG);
// plus another also very ugly TRACE switch
app.set('TRACE', config.debugging.TRACE);

// the path to the file system where the rfid tags and Media Files are stored
app.set('rfidTagDir', config.directories.rfidTagDir);
app.set('MediaDir', config.directories.MediaDir);
app.set('SoundDir', config.directories.SoundDir);

// set server address
app.set('AppName', config.fileServiceEndpoint.AppName);
app.set('svrProtocol', config.fileServiceEndpoint.Protocol);
app.set('svrHost', config.fileServiceEndpoint.Host);
app.set('svrPort', Number(config.fileServiceEndpoint.Port));
app.set('svrApi', config.fileServiceEndpoint.Api);
app.set('svrUrl', config.fileServiceEndpoint.Url);


// get global app variables
var DEBUG = app.get('DEBUG');
var TRACE = app.get('TRACE');

// get the info on where we are running
var AppName = app.get('AppName');
var svrProto = app.get('svrProtocol');
var svrAddr = app.get('svrHost');
var svrPort = app.get('svrPort');
var svrApi = app.get('svrApi');
var svrUrl = app.get('svrUrl');


// targetTmpDir is where we store the uploaded files,
// prior resizing and moving to the final directories
// final directories are /data/Cover/icon .../small .../normal
var targetTmpDir    = config.directories.UploadTmpDir;
var targetIconDir   = config.directories.UploadIconDir;
var targetSmallDir  = config.directories.UploadSmallDir;
var targetNormalDir = config.directories.UploadNormalDir;


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

// routes
// redirect to upload form
app.get('/', function(req, res) {
  if (DEBUG) console.log('get::/ called - redirecting to '+svrAddr+':'+svrPort+svrApi+'/file');
  // the server checks whether the client accepts html (browser) or
  // json (machine to machine) communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');
  if (acceptsHTML) {
    res.redirect(svrProto+'://'+svrAddr+':'+svrPort+svrApi+svrUrl);
  } else {
    if (DEBUG) console.log("json request");
    res.json({
      response: 'unavailable',
      status: 415,
      message: 'this endpoint is not available for json requests'
    });
  }
})

// redirect to upload form
app.get(svrApi+'/', function(req, res) {
  if (DEBUG) console.log('get::'+svrApi+'/ called - redirecting to '+svrAddr+':'+svrPort+svrApi+'/file');
  // the server checks whether the client accepts html (browser) or
  // json (machine to machine) communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');
  if (acceptsHTML) {
    res.redirect(svrProto+'://'+svrAddr+':'+svrPort+svrApi+'/file');
  } else {
    if (DEBUG) console.log("json request");
    res.json({
      response: 'unavailable',
      status: 415,
      message: 'this endpoint is not available for json requests'
    });
  }
})

// get the file upload form
app.get(svrApi+'/file', function(req, res) {
  if (DEBUG) console.log('get::'+svrApi+'/file called');
  // the server checks whether the client accepts html (browser) or
  // json (machine to machine) communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');
  if (acceptsHTML) {
    res.render('fileform', { message: 'choose a file' });
  } else {
    if (DEBUG) console.log("json request");
    res.json({
      response: 'unavailable',
      status: 415,
      message: 'this endpoint is not available for json requests'
    });
  }
})

// post the new file from the upload form
app.post(svrApi+'/file', function(req, res) {
  if (DEBUG) console.log('post::'+svrApi+'/file called');
  // the server checks whether the client accepts html (browser) or
  // json (machine to machine) communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  var upload = multer({
        storage: multer.memoryStorage()
  }).single('userFile')

  upload(req, res, function(err) {
    try {
      var buffer = req.file.buffer
      var magic = buffer.toString('hex', 0, 4)
      //var filename = req.file.fieldname + '-' + Date.now() + path.extname(req.file.originalname)
      var filename = req.file.originalname;
    } catch (ex) {
      var message = 'warning: no file provided, but upload button pressed - ignoring';
      console.warn(message);
      res.render('fileform', { message: message });
    }

    if (checkMagicNumbers(magic)) {
      try {
        fs.writeFile(targetTmpDir + '/' + filename, buffer, 'binary', function(err) {
          if (err) {
            console.error('error: could not upload '+filename+' to '+targetTmpDir+'.' + err.toString());
            if (acceptsHTML) {
              var message = 'could not upload '+filename+' to '+targetTmpDir+'.' + err.toString()
              res.render('fileform', { message: message });
            } else {
              responseContent = {
                response: 'error',
                message: 'could not upload file ' + filename + ' to directory ' + targetTmpDir,
                error: err.toString()
              };
              return(responseContent);
              /*
              res.json({
                response: 'error',
                message: 'could not upload ' + filename + ' to directory ' + targetTmpDir,
                error: err
              });
              */
            }
          } else {
            if (DEBUG) console.log('File \'' + filename + '\' uploaded to ' + targetTmpDir);
            if (acceptsHTML) {
              var message = 'File '+filename+' uploaded to ' + targetTmpDir;
              res.render('fileform', { message: message });
            } else {
              responseContent = {
                response: 'success',
                message: 'file ' + filename + ' uploaded to directory ' + targetTmpDir
              };
              return(responseContent);
              /*
              res.json({
                response: 'success',
                message: 'file ' + filename + ' uploaded to directory ' + targetTmpDir,
              })
              */
            }
          }
        })
      } catch (ex) {
        console.error('error: could not upload '+filename+' to '+targetTmpDir+'.' + ex.toString());
        if (acceptsHTML) {
          var message = 'There was an exception while uploading file '+filename+' to '+targetTmpDir+' - exception: ' + ex.toString();
          res.render('fileform', { message: message });
        } else {
          responseContent = {
            response: 'error',
            message: 'exception while uploading file ' + filename + ' to directory ' + targetTmpDir,
            error: ex.toString()
          };
          return(responseContent);
          /*
          res.json({
            response: 'error',
            message: 'exception while uploading ' + filename + ' to directory ' + targetTmpDir,
            error: ex.toString()
          })
          */
        }
      }
    } else {
      console.warn('provided file ' + filename + ' is not a valid image - not uploaded');
      if (acceptsHTML) {
        var message = 'File is not valid - not uploaded';
        res.render('fileform', { message: message });
      } else {
        responseContent = {
          response: 'warning',
          message: 'file ' + filename + ' is not an image - not uploaded'
        };
        return(responseContent);
        /*
        res.json({
          response: 'warning',
          message: 'File is not a valid image file'
        });
        */
      }
    }
  });
})

// start the server
var server = app.listen(svrPort, function () {
  console.log("%s listening on %s://%s:%s with API on %s%s...", AppName, svrProto, svrAddr, svrPort, svrApi, svrUrl);
});
