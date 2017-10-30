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
    if (DEBUG) console.log("root entry requested");
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
          messagetext: '&Uuml;ber die Navigation kannst Du die einzelnen Funktionen ausw&auml;hlen'
      });
    } else {
      if (DEBUG) console.log("json request");
      res.json({response: 'REST API Endpoints available',
                    endpoints: [
                        {endpoint: svrAddr+':'+svrPort+svrApi+'/tags', description: 'the rfid tags'},
                        {endpoint: rfidReaderAddr+':'+rfidReaderPort+rfidReaderApi+rfidReaderUrl, description: 'the rfid reader'},
                        {endpoint: fileServiceAddr+':'+fileServicePort+fileServiceApi+fileServiceUrl, description: 'file upload form'},
                        {endpoint: playerAddr+':'+playerPort+playerApi+playerUrl, description: 'the mp3 player'}
                    ]
      });
    }
  });

  // the staus or health check endpoint
  app.get(svrApi+"/status", function(req, res) {
    if (DEBUG) console.log("status entry requested");
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
