var config = require('../modules/configuration.js');

// CONFIG data on the RFID/NFC Tag DB Service
const tagDbServiceAppName = config.tagDbServiceEndpoint.AppName;
const tagDbServiceProtocol = config.tagDbServiceEndpoint.Protocol;
const tagDbServiceHost = config.tagDbServiceEndpoint.Host;
const tagDbServicePort = Number(config.tagDbServiceEndpoint.Port);
const tagDbServiceApi = config.tagDbServiceEndpoint.Api;
const tagDbServiceUrl = config.tagDbServiceEndpoint.Url;
const tagDbServiceHealthUri = config.tagDbServiceEndpoint.HealthUri;
const tagDbServiceHelpUri = config.tagDbServiceEndpoint.HelpUri;
const tagDbServiceDescription = config.tagDbServiceEndpoint.Description;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

var tagRouter = function(app) {
  // redirects
  app.get("/tags", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(tagDbServiceApi+"/tags");
    } else {
      if (DEBUG) console.log("json request");
      res.json({
        response: 'redirect',
        status: 302,
        message: 'this endpoint is not available for json requests',
        redirect: tagDbServiceApi+'/tags'
      });
    }
  });
  app.get("/tags/tag/:id", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(tagDbServiceApi+"/tags/tag/:id");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: tagDbServiceApi+'/tags/tag/:id'
        });
    }
  });
  app.get("/tags/tag/create", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(tagDbServiceApi+"/tags/tag/create");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'unavailable',
          status: 415,
          message: 'this endpoint is not available for json requests',
          redirect: tagDbServiceApi+'/tags/tag'
        });
    }
  });
  app.get("/info", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(tagDbServiceApi+"/tags/info");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: tagDbServiceApi+"/tags/info"
        });
    }
  });
  app.get("/tags/info", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(tagDbServiceApi+"/tags/info");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: tagDbServiceApi+"/tags/info"
        });
    }
  });
  app.get("/tags/endpoints", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(tagDbServiceApi+"/endpoints");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: tagDbServiceApi+"/tags/endpoints"
        });
    }
  });
  app.get("/endpoints", function(req, res){
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      res.status(302).redirect(tagDbServiceApi+"/tags/endpoints");
    } else {
      if (DEBUG) console.log("json request");
      res.json(
        {
          response: 'redirect',
          status: 302,
          message: 'this endpoint is not available for json requests',
          redirect: tagDbServiceApi+"/tags/endpoints"
        });
    }
  });
}

module.exports = tagRouter;
