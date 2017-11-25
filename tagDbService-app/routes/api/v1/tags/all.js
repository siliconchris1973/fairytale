const appRoutes = require('express').Router();

var config = require('../../../../modules/configuration.js');
var appController = require('../../../../controller/tagDbServiceController.js');

// CONFIG data on the RFID/NFC Tag DB Service
const svrAppName = config.tagDbServiceEndpoint.AppName;
const svrProtocol = config.tagDbServiceEndpoint.Protocol;
const svrHost = config.tagDbServiceEndpoint.Host;
const svrPort = Number(config.tagDbServiceEndpoint.Port);
const svrApi = config.tagDbServiceEndpoint.Api;
const svrUrl = config.tagDbServiceEndpoint.Url;
const svrHealthUri = config.tagDbServiceEndpoint.HealthUri;
const svrHelpUri = config.tagDbServiceEndpoint.HelpUri;
const svrDescription = config.tagDbServiceEndpoint.Description;
const svrInfoUri = config.tagDbServiceEndpoint.InfoUri;
const svrWelcomeUri = config.tagDbServiceEndpoint.WelcomeUri;
const svrStatusUri = config.tagDbServiceEndpoint.StatusUri;
const svrEndpointsUri = config.tagDbServiceEndpoint.EndpointsUri;
const svrFullUrl = svrProtocol+'://'+svrHost+':'+svrPort+svrApi+svrUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

const soundDir = config.directories.SoundDir;
const mediaDir = config.directories.MediaDir;
const tagDB = config.directories.TagDB;
var nfcTagDir = tagDB;

// GET ALL Tags Endpoint
// get the listing of all stored nfc tags
appRoutes.get('/', (req, res) => {
  if (DEBUG) console.log('get::'+svrApi+svrUrl+' called');

  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  var result = function(app) {
    appController.getTagList
    .then(function (result){
      var obj = result;
      if (acceptsHTML) {
        if (TRACE) console.log("   html request");
        if (DEBUG) console.log("request to render tag list");
        if (TRACE) console.log(obj.tags);
        res.status(200).render('tags', {
          title: 'NFC Tag Startseite',
          headline: 'NFC Tag Liste',
          subheadline: 'Verf&uuml;gbare Tags',
          messagetext: 'Bitte ein RFID Tag ausw&auml;hlen, um mehr Daten angezeigt zu bekommen',
          varTags: obj.tags
        });
      } else {
        if (TRACE) console.log('   json request');
        res.status(200).json({
          info: {
            response: 'info',
            status: 200,
            status_text: '200 - ok',
            message: 'endpoint to tags API',
            endpoints: result
          }
        });
      };
    })
    .catch(function(err){
      console.error('error: getting the list of tags failed\nerror message: ' + err.toString());
      if (acceptsHTML) {
        if (TRACE) console.log('   html request');
        res.status(500).render('tags_error', {
          title: 'RFID Tag Fehlerseite',
          headline: 'RFID Tag Liste Fehler',
          errorname: 'Error',
          errortext: 'Fehler beim abrufen der Liste an verf&uuml;gbarer Tags ',
          exceptionname: 'Exception',
          exceptiontext: err.toString()
        });
      } else {
        if (TRACE) console.log('   json request');
        console.log(err);
        res.status(500).json({
          response: 'error',
          status: 500,
          status_text: '500 - internal server error',
          message: 'error retrieving data on available tags',
          error: err.toString()
        });
      };
    });
  };
});

/*
 *      TAG DB SERVICE ROUTES FOR REDIRECTION
 */
 appRoutes.get("/all", (req, res) => {
   if (DEBUG) console.log('GET::'+svrFullUrl+'/all');
   // the server checks whether the client accepts html (browser) or
   // json machine to machine communication
   var acceptsHTML = req.accepts('html');
   var acceptsJSON = req.accepts('json');

   if (acceptsHTML) {
     if (TRACE) console.log('   redirecting to '+svrFullUrl);
     res.status(302).redirect(svrFullUrl);
   } else {
     res.json({
       response: 'redirect',
       status: 302,
       status_text: '302 - redirect',
       message: 'this endpoint is not available for json requests',
       redirect: svrFullUrl
     });
   }
 });
appRoutes.get("/list", (req, res) => {
  if (DEBUG) console.log('GET::'+svrFullUrl+'/list');
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+svrFullUrl);
    res.status(302).redirect(svrFullUrl);
  } else {
    res.json({
      response: 'redirect',
      status: 302,
      status_text: '302 - redirect',
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl
    });
  }
});

module.exports = appRoutes;
