const playerRoutes = require('express').Router();

var config = require('../../../../modules/configuration.js');
var appController = require('../../../../controller/playerController.js');

// CONFIG data on the MP3 Player
const svrAppName = config.playerEndpoint.AppName;
const svrProtocol = config.playerEndpoint.Protocol;
const svrHost = config.playerEndpoint.Host;
const svrPort = Number(config.playerEndpoint.Port);
const svrApi = config.playerEndpoint.Api;
const svrUrl = config.playerEndpoint.Url;
const svrHealthUri = config.playerEndpoint.HealthUri;
const svrHelpUri = config.playerEndpoint.HelpUri;
const svrInfoUri = config.playerEndpoint.InfoUri;
const svrStatusUri = config.playerEndpoint.StatusUri;
const svrEndpointsUri = config.playerEndpoint.EndpointsUri;
const svrDescription = config.playerEndpoint.Description;
const svrFullUrl = svrProtocol+'://'+svrHost+':'+svrPort+svrApi+svrUrl;

// CONFIG data on the tagDB Service
const tagDbServiceAppName = config.tagDbServiceEndpoint.AppName;
const tagDbServiceProtocol = config.tagDbServiceEndpoint.Protocol;
const tagDbServiceHost = config.tagDbServiceEndpoint.Host;
const tagDbServicePort = Number(config.tagDbServiceEndpoint.Port);
const tagDbServiceApi = config.tagDbServiceEndpoint.Api;
const tagDbServiceUrl = config.tagDbServiceEndpoint.Url;
const tagDbServiceHealthUri = config.tagDbServiceEndpoint.HealthUri;
const tagDbServiceHelpUri = config.tagDbServiceEndpoint.HelpUri;
const tagDbServiceInfoUri = config.tagDbServiceEndpoint.InfoUri;
const tagDbServiceWelcomeUri = config.tagDbServiceEndpoint.WelcomeUri;
const tagDbServiceStatusUri = config.tagDbServiceEndpoint.StatusUri;
const tagDbServiceEndpointsUri = config.tagDbServiceEndpoint.EndpointsUri;
const tagDbServiceDescription = config.tagDbServiceEndpoint.Description;
const tagDbServiceFullUrl = tagDbServiceProtocol + '://'+tagDbServiceHost+':'+tagDbServicePort+tagDbServiceApi+tagDbServiceUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

// the http call to the tagDb rest api wrapped in a promise
function httpRequest(params, postData) {
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
            status: 500,
            status_text: '500 - internal server error',
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
        status: 500,
        status_text: '500 - internal server error',
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

// endpoints entry for the Player API
playerRoutes.get("/play/:id", (req, res) => {
  if (DEBUG) console.log('GET::'+svrApi+svrUrl+'/play/:id');
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if(!req.params.id) {
    var responseJson = {
      response: 'Warning',
      message: 'No ID provided, so nothing to play',
      status: 400,
      status_text: '400 - Bad Request',
      error: 'Missing ID'
    };

    console.warn(responseJson)

    if (acceptsHTML) {
      if (TRACE) console.log("   html request");
      res.status(400).render('app_error', responseJson);
    } else {
      if (TRACE) console.log("   json request");
      res.status(400).json(responseJson);
    }
  } else {
    // get all the necesary information on the album and the track to be played
    var tagId = req.params.id;
    if (TRACE) console.log('request to play album ' + tagId + ' received');
    // TODO add call to playerController
    appController.play(tagId);

    if (acceptsHTML) {
      if (TRACE) console.log("   html request");
      var respObj = responseJson;
      res.status(200).render('app_view', respObj);
    } else {
      if (TRACE) console.log("   json request");
      res.status(200).json(responseJson);
    }
  }
});

// endpoints entry for the Player API
playerRoutes.get("/play", (req, res) => {
  if (DEBUG) console.log('GET::'+svrApi+svrUrl+'/play');
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  // call the tagDbService to get a list f available tags
  var httpParams = {
    protocol: tagDbServiceProtocol + ':',
    host: tagDbServiceHost,
    port: Number(tagDbServicePort),
    path: tagDbServiceApi+tagDbServiceUrl,
    family: 4,
    headers: {'User-Agent': 'request', 'Content-Type': 'application/json', 'Accept': 'application/json'},
    method: 'GET'
  };

  if (DEBUG) console.log('sending http request to tagDbService REST api');
  httpRequest(httpParams).then(function(body) {
    if (TRACE) console.log(body);
    // and so on
    var fbResponse = JSON.parse(body);
    var obj = fbResponse;
    if (DEBUG) console.log('providing data to player play site');
    var responseJson = {
      response: 'info',
      message: 'Verf&uuml;gbare Alben',
      status: 200,
      status_text: '200 - ok',
      alben: {
        obj
      }
    };
  }).then(function(body) {
    if (TRACE) console.log(body);
    if (acceptsHTML) {
      if (TRACE) console.log("   html request");
      var respObj = responseJson;
      res.status(200).render('app_view', respObj);
    } else {
      if (TRACE) console.log("   json request");
      res.status(200).json(responseJson);
    }
  });
});
module.exports = playerRoutes;
