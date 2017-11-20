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

  // the root entry shall show what could be done
  appRoutes.get(svrApi+svrUrl, function(req, res) {
    if (DEBUG) console.log('GET::'+svrApi+svrUrl);
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      if (TRACE) console.log("html request");
      res.render('content', {
          title: 'Welcome to Fairytale',
          headline: 'Willkommen im Märchenschloss',
          subheadline: 'W&auml;hle eine Funktion',
          messagetext: '&Uuml;ber die Navigation kannst Du die einzelnen Funktionen ausw&auml;hlen',
      });
    } else {
      if (TRACE) console.log("json request");
      var respEndpoints = {
        response: 'REST API Endpoints available',
        endpoints: appEndpoints
        };
      res.json(respEndpoints);
    }
  });

module.exports = appRoutes;
