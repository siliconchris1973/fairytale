var appRouter = function(app) {
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  var svrAddr = app.get('svrAddr');
  var svrPort = app.get('svrPort');
  var svrApi = app.get('svrApi');
  // player service
  var playerAddr = app.get('playerAddr');
  var playerPort = app.get('playerPort');
  var playerApi = app.get('playerApi');
  var playerUrl = app.get('playerUrl');
  // file Service Service
  var fileServiceAddr = app.get('fileServiceAddr');
  var fileServicePort = app.get('fileServicePort');
  var fileServiceApi = app.get('fileServiceApi');
  var fileServiceUrl = app.get('fileServiceUrl');
  // file Service Service
  var rfidReaderAddr = app.get('rfidReaderAddr');
  var rfidReaderPort = app.get('rfidReaderPort');
  var rfidReaderApi = app.get('rfidReaderApi');
  var rfidReaderUrl = app.get('rfidReaderUrl');


  app.get("/", function(req, res){
    res.redirect(svrApi+'/');
  });

  app.get("/status", function(req, res){
    res.redirect(svrApi+'/status');
  });

  // the root entry shall show what could be done
  app.get(svrApi+"/", function(req, res) {
    if (DEBUG) console.log('GET::'+svrApi+'/');
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");

      res.render('content', {
          title: 'Welcome to Fairytale',
          headline: 'Willkommen im Märchenschloss',
          subheadline: 'W&auml;hle eine Funktion',
          messagetext: '&Uuml;ber die Navigation kannst Du die einzelnen Funktionen ausw&auml;hlen',
      });
    } else {
      if (DEBUG) console.log("json request");
      res.redirect(svrApi+'/endpoints');
      //res.json({respEndpoints});
    }
  });

  // the root entry shall show what could be done
  app.get(svrApi+"/endpoints", function(req, res) {
    if (DEBUG) console.log('GET::'+svrApi+'/endpoints');
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    var respEndpoints = {
      response: 'REST API Endpoints available',
      endpoints: [
        {endpoint: svrAddr+':'+svrPort+svrApi+'/', description: 'info'},
        {endpoint: svrAddr+':'+svrPort+svrApi+'/status', description: 'status'},
        {endpoint: svrAddr+':'+svrPort+svrApi+'/health', description: 'main app health port'},
        {endpoint: svrAddr+':'+svrPort+svrApi+'/tags', description: 'rfid/nfc tags db'},
        {endpoint: playerAddr+':'+playerPort+playerApi+playerUrl, description: 'mp3 player interface'},
        {endpoint: playerAddr+':'+playerPort+playerApi+'/health', description: 'mp3 player health port'},
        {endpoint: rfidReaderAddr+':'+rfidReaderPort+rfidReaderApi+rfidReaderUrl, description: 'rfid reader interface'},
        {endpoint: rfidReaderAddr+':'+rfidReaderPort+rfidReaderApi+'/health', description: 'rfid reader health port'},
        {endpoint: fileServiceAddr+':'+fileServicePort+fileServiceApi+fileServiceUrl, description: 'file upload form'},
        {endpoint: fileServiceAddr+':'+fileServicePort+fileServiceApi+'/health', description: 'fileService health port'},
      ]};
    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      var obj = respEndpoints;
      res.render('endpoints', {
          title: 'Welcome to Fairytale',
          headline: 'Willkommen im Märchenschloss',
          subheadline: 'Verf&uuml;gbare REST Endpunkte',
          messagetext: '&Uuml;ber die Navigation kannst Du die einzelnen Funktionen ausw&auml;hlen',
          varEndpoints: obj.endpoints
      });
    } else {
      if (DEBUG) console.log("json request");
      res.json(respEndpoints);
    }
  });

  // the staus or health check endpoint
  app.get(svrApi+"/status", function(req, res) {
    if (DEBUG) console.log('GET::'+svrApi+'/status');
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");

      res.render('component_status', {
          title: 'Komponentenstatus',
          headline: 'Komponentenstatus',
          subheadline: 'Status der einzelnen Komponenten...'
      });
    } else {
      if (DEBUG) console.log("json request");
      res.json({response: 'status information requested',
                  endpoints: [
                      {endpoint: svrAddr+':'+svrPort+svrApi+'/tags', status: 'ok'},
                      {endpoint: rfidReaderAddr+':'+rfidReaderPort+rfidReaderApi+rfidReaderUrl, status: 'ok'},
                      {endpoint: fileServiceAddr+':'+fileServicePort+fileServiceApi+fileServiceUrl, status: 'ok'},
                      {endpoint: playerAddr+':'+playerPort+playerApi+playerUrl, status: 'ok'}
                  ]
      });
    }
  });
}

module.exports = appRouter;
