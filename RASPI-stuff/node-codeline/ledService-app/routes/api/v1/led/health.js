const appRoutes = require('express').Router();

var config = require('../../../../modules/configuration.js');
var appController = require('../../../../controller/ledServiceController.js');

// CONFIG data on the MP3 Player
const svrAppName = config.ledServiceEndpoint.AppName;
const svrProtocol = config.ledServiceEndpoint.Protocol;
const svrHost = config.ledServiceEndpoint.Host;
const svrPort = Number(config.ledServiceEndpoint.Port);
const svrApi = config.ledServiceEndpoint.Api;
const svrUrl = config.ledServiceEndpoint.Url;
const svrHealthUri = config.ledServiceEndpoint.HealthUri;
const svrHelpUri = config.ledServiceEndpoint.HelpUri;
const svrInfoUri = config.ledServiceEndpoint.InfoUri;
const svrStatusUri = config.ledServiceEndpoint.StatusUri;
const svrEndpointsUri = config.ledServiceEndpoint.EndpointsUri;
const svrDescription = config.ledServiceEndpoint.Description;
const svrFullUrl = svrProtocol+'://'+svrHost+':'+svrPort+svrApi+svrUrl;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

appRoutes.get('/health', (req, res) => {
  if (DEBUG) console.log('GET::'+svrApi+svrUrl+'/health');
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log("   html request");

    res.status(200).render('health', {
      title: svrAppName + ' Health',
      headline: svrAppName,
      subheadline: 'Health',
      messagetext: 'THIS PAGE IS A PLACEHOLDER - COMPONENT HEALTH TO COME LATER'
    });
  } else {
    if (TRACE) console.log("   json request");
    res.status(200).json({ message: 'HEALTH!' });
  }
});

module.exports = appRoutes;
