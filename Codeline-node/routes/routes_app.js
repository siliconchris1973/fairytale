var appRouter = function(app) {
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var svrAddr = app.get('svrAddr');

    // the staus or health check endpoint
    app.get("/status", function(req, res) {
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
                            {endpoint: svrAddr+'/tags', status: 'ok'},
                            {endpoint: svrAddr+'/rfid', status: 'ok'},
                            {endpoint: svrAddr+'/player', status: 'ok'}
                        ]
                    });
        }
    });

    // the root entry shall show what could be done
    app.get("/", function(req, res) {
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
                            {endpoint: svrAddr+'/tags', description: 'the rfid tags'},
                            {endpoint: svrAddr+'/rfid', status: 'the rfid reader'},
                            {endpoint: svrAddr+'/player', status: 'the mp3 player'}
                        ]

          });
        }
    });
}

module.exports = appRouter;
