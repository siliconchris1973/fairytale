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
const svrDescription = config.appEndpoint.Description;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

appRoutes.get('/info', (req, res) => {
  if (DEBUG) console.log('GET::'+svrApi+svrUrl+'/info');
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');
  var obj = appController.getEndpoints();

  if (acceptsHTML) {
    if (TRACE) console.log("html request");

    res.status(200).render('app', {
      title: 'Fairytale App Info',
      headline: 'Fairytale App',
      subheadline: 'Info',
      messagetext: 'THIS PAGE IS A PLACEHOLDER - COMPONENT INFO TO COME LATER'
    });
  } else {
    if (TRACE) console.log("json request");
    res.status(200).json({ message: 'INFO!' });
  }
});

module.exports = appRoutes;
