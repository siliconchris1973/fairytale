const appRoutes = require('express').Router();

var config = require('../../../../modules/configuration.js');
var appController = require('../../../../controller/appController.js');

// CONFIG data on the app
const svrAppName = config.appEndpoint.AppName;
const svrProtocol = config.appEndpoint.Protocol;
const svrHost = config.appEndpoint.Host;
const svrPort = Number(config.appEndpoint.Port);
const svrApi = config.appEndpoint.Api;
const svrUrl = config.appEndpoint.Url;
const svrHealthUri = config.appEndpoint.HealthUri;
const svrHelpUri = config.appEndpoint.HelpUri;
const svrInfoUri = config.appEndpoint.InfoUri;
const svrStatusUri = config.appEndpoint.StatusUri;
const svrWelcomeUri = config.appEndpoint.WelcomeUri;
const svrEndpointsUri = config.appEndpoint.EndpointsUri;
const svrDescription = config.appEndpoint.Description;
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
      status_text: '302 - redirect',
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
