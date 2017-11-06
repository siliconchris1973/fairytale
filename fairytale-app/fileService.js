var express = require('express'),
  app = express(),
  port = process.env.PORT || 3001;

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

// these settings are made available via app.get('variable name')
// from within all subsequent scripts

// set server address
app.set('svrProto', 'http');
app.set('svrAddr', os.hostname());
app.set('svrPort', Number(3001));
app.set('svrApi', '/api/v1');

// and a rather ugly global DEBUG switch
app.set('DEBUG', true);
// plus another also very ugly TRACE switch
app.set('TRACE', true);

app.set('/img', express.static('static/img'));
app.set('/Media', express.static('../data/Media'));
app.set('/Cover', express.static('../data/Cover'));


// get global app variables
var DEBUG = app.get('DEBUG');
var TRACE = app.get('TRACE');

var svrProto = app.get('svrProto');
var svrAddr = app.get('svrAddr');
var svrPort = app.get('svrPort');
var svrApi = app.get('svrApi');


// this is where we store the uploaded files, prior resizing and moving to final directory
// final directory is /data/Cover/icon .../small .../normal
var dataDir  = '../data';
var coverDir = '/Cover';
var targetTmpDir  = dataDir + coverDir + '/tmp';
var targetIconDir  = dataDir + coverDir + '/icon';
var targetSmallDir  = dataDir + coverDir + '/small';
var targetNormalDir  = dataDir + coverDir + '/normal';


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

	res.redirect(svrProto+'://'+svrAddr+':'+svrPort+svrApi+'/file');
})

// redirect to upload form
app.get(svrApi+'/', function(req, res) {
  if (DEBUG) console.log('get::'+svrApi+'/ called - redirecting to '+svrAddr+':'+svrPort+svrApi+'/file');
  // the server checks whether the client accepts html (browser) or
  // json (machine to machine) communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

	res.redirect(svrProto+'://'+svrAddr+':'+svrPort+svrApi+'/file');
})

// get the file upload form
app.get(svrApi+'/file', function(req, res) {
  if (DEBUG) console.log('get::'+svrApi+'/file called');
  // the server checks whether the client accepts html (browser) or
  // json (machine to machine) communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

	res.render('fileform', { message: 'choose a file' });
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
              responseContent = '\'response\': \'error\', \'message\': \'could not upload file ' + filename + ' to directory ' + tmpTargetDir + '\', \'error\': ' + err.toString();
              return(responseContent);
              /*
              res.json({
                response: 'error',
                message: 'could not upload ' + filename + ' to directory ' + tmpTargetDir,
                error: err
              });
              */
            }
          } else {
            if (DEBUG) console.log('provided file ' + filename + ' was uploaded to ' + targetTmpDir);
            if (acceptsHTML) {
              var message = 'File '+filename+' is uploaded to ' + targetTmpDir;
              res.render('fileform', { message: message });
            } else {
              responseContent = '\'response\': \'success\', \'message\': \'file ' + filename + ' uploaded to directory ' + tmpTargetDir + '\'';
              return(responseContent);
              /*
              res.json({
                response: 'success',
                message: 'file ' + filename + ' uploaded to directory ' + tmpTargetDir,
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
          responseContent = '\'response\': \'error\', \'message\': \'exception while uploading file ' + filename + ' to directory ' + tmpTargetDir + '\', \'error\': ' + ex.toString();
          return(responseContent);
          /*
          res.json({
            response: 'error',
            message: 'exception while uploading ' + filename + ' to directory ' + tmpTargetDir,
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
        responseContent = '\'response\': \'warning\', \'message\': \'file ' + filename + ' is not an image - not uploaded';
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
var server = app.listen(port, function () {
  console.log("fileService listening on %s://%s:%s...", svrProto, svrAddr, svrPort);
});
