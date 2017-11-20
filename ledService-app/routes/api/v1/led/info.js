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

appRoutes.get('/info', (req, res) => {
  if (DEBUG) console.log('GET::'+svrApi+svrUrl+'/info');
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');

  if (acceptsHTML) {
    if (TRACE) console.log("   html request");

    res.status(200).render('info', {
      title: svrAppName + ' Info',
      headline: svrAppName,
      subheadline: 'Info',
      messagetext: 'THIS PAGE IS A PLACEHOLDER - COMPONENT INFO TO COME LATER'
    });
  } else {
    if (TRACE) console.log("   json request");
    res.status(200).json({ message: 'INFO!' });
  }
});

module.exports = appRoutes;
