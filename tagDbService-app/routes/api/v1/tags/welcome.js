const appRoutes = require('express').Router();

var config = require('../../../../modules/configuration.js');
var appController = require('../../../../controller/tagDbServiceController.js');

// CONFIG data on the MP3 Player
const svrAppName = config.tagDbServiceEndpoint.AppName;
const svrProtocol = config.tagDbServiceEndpoint.Protocol;
const svrHost = config.tagDbServiceEndpoint.Host;
const svrPort = Number(config.tagDbServiceEndpoint.Port);
const svrApi = config.tagDbServiceEndpoint.Api;
const svrUrl = config.tagDbServiceEndpoint.Url;
const svrHealthUri = config.tagDbServiceEndpoint.HealthUri;
const svrHelpUri = config.tagDbServiceEndpoint.HelpUri;
const svrInfoUri = config.tagDbServiceEndpoint.InfoUri;
const svrStatusUri = config.tagDbServiceEndpoint.StatusUri;
const svrEndpointsUri = config.tagDbServiceEndpoint.EndpointsUri;
const svrDescription = config.tagDbServiceEndpoint.Description;
const svrFullUrl = svrProtocol+'://'+svrHost+':'+svrPort+svrApi+svrUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

// welcome entry for Player API
appRoutes.get("/", (req, res) => {
  if (DEBUG) console.log('GET::'+svrApi+svrUrl+'/');

  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log('   redirecting to '+svrFullUrl+'/welcome');
    res.status(302).redirect(svrFullUrl+'/welcome');
  } else {
    res.status(302).json({
      response: 'redirect',
      status: 302,
      message: 'this endpoint is not available for json requests',
      redirect: svrFullUrl+'/welcome'
    });
  }
});

// welcome entry for Player API
appRoutes.get("/welcome", (req, res) => {
  if (DEBUG) console.log('GET::'+svrApi+svrUrl+'/welcome');

  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log("   html request");
    res.status(200).render('welcome', {
      title: svrAppName+' Welcome',
      headline: svrAppName,
      subheadline: 'Willkommen',
      messagetext: 'WELCOME PAGE TO COMPONENT TO COME LATER'
    });
  } else {
    if (TRACE) console.log("   json request");
    res.status(200).json({ message: 'WELCOME!' });
  }
});

module.exports = appRoutes;
