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

appRoutes.get("/endpoints", (req, res) => {
  if (DEBUG) console.log('GET::'+svrApi+svrUrl+'/endpoints');
  // the server checks whether the client accepts html (browser) or
  // json machine to machine communication
  var acceptsHTML = req.accepts('html');
  var acceptsJSON = req.accepts('json');
  var obj = appController.getEndpoints();

  if (acceptsHTML) {
    if (TRACE) console.log("   html request");

    res.status(200).render('endpoints', {
      title: svrAppName + ' Endpoints',
      headline: svrAppName,
      subheadline: 'Endpunkte',
      messagetext: 'Endpunkt ausw&auml;hlen',
      varEndpoints: obj.endpoints
    });
  } else {
    if (TRACE) console.log("   json request");
    var respEndpoints = {
      message: 'REST API Endpoints available',
      endpoints: obj.endpoints
      };
    res.status(200).json(respEndpoints);
  }
});

module.exports = appRoutes;
