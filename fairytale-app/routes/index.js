var config = require('../modules/configuration.js');

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

var appRouter = function(app) {
  app.get("/", function(req, res) {
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(svrApi+'/');
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: svrApi+"/"
        });
    }
  });
  app.get("/status", function(req, res) {
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(svrApi+'/status');
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: svrApi+"/status"
        });
    }
  });
  app.get("/endpoints", function(req, res) {
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(svrApi+'/endpoints');
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: svrApi+"/endpoints"
        });
    }
  });
}

module.exports = appRouter;
