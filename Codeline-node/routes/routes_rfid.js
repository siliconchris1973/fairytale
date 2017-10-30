var rfidRouter = function(app) {
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  var rfidReaderProto = app.get('rfidReaderProto');
  var rfidReaderAddr = app.get('rfidReaderAddr');
  var rfidReaderPort = app.get('rfidReaderPort');
  var rfidReaderApi = app.get('rfidReaderApi');

  // root entry for RFID tag data
  app.get("/rfid", function(req, res) {
    res.redirect(rfidReaderApi+"/rfid");
  });


  // root entry for RFID tag data
  app.get(rfidReaderApi+"/rfid", function(req, res) {
    if (DEBUG) console.log("rfid reader entry info requested");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    // holds the response data to be send as either html or json
    var responseContent = "";
    try {
      if (acceptsHTML) {
        if (DEBUG) console.log("html request");
        res.render('tags', {
          title: 'RFID Reader Startseite',
          headline: 'RFID Reader Startseite',
          subheadline: 'Willkommen',
          messagetext: 'Hier&uuml;ber kannst Du den RFID Reader ansprechen',
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
        if (DEBUG) console.log("json request");
        res.json({
          response: 'info endpoint to tags API',
          endpoints: [
                      {endpoint: rfidReaderProto + '://' + rfidReaderAddr + ':' + rfidReaderPort + rfidReaderApi + '/rfid', description: 'query (GET) the RFID reader'}
          ]
        });
      }
    } catch (ex) {
      console.error("could not query rfid reader \nException output: " + ex.toString());
      //process.exit();
      if (acceptsHTML) {
        res.render('rfid_error', {
          title: 'RFID Reader Fehlerseite',
          headline: 'RFID Reader Fehler',
          errorname: 'Error',
          errortext: 'could not query rfid reader',
          exceptionname: 'Exception',
          exceptiontext: ex.toString(),
          controlheadline: 'Verf&uuml;gbare Kommandos'
        });
      } else {
        res.json({
          response: 'error',
          message: 'could not query rfid reader',
          exception: ex.toString()
        });
      }
    }
  })
}

module.exports = rfidRouter;
