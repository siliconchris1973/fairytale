// TODO: change these two variables to something dynamic
// DEBUG is of course for debug output
var DEBUG=true;

var path = require('path');
var fs = require('fs');

// global file structure variables - move to configuration
var dataDir = "data"
var coverPicDir = path.join(dataDir, "Cover");
var audioDataDir = path.join(dataDir, "Audiobooks");
var rfidTagDir = path.join(dataDir, "rfidTagData");
var rfidTagFile = "NOTAG";
var rfidTagFileSuffix = "json";
var svrAddr = "http://127.0.0.1:3000"



var appRouter = function(app) {
  // the staus or health check endpoint
  app.get("/status", function(req, res) {
    if (DEBUG) console.log("root entry requested");
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      var responseContent = "<html><h1>Fairytale is alive</h1>\
                              <table> \
                                <tr><td>Service</td> <td>Status</td></tr> \
                                <tr><td><a href=\""+svrAddr+"/rfid\">/rfid</a></td><td>ok</td></tr> \
                                <tr><td><a href=\""+svrAddr+"/player\">/player</a></td><td>ok</td></tr> \
                              </table> \
                            </html>";
    } else {
      if (DEBUG) console.log("json request");
      var responseContent = "{\"status\": \"info\", \"message\": \"service status\", \
                              \n  \"endpoints\": [ \
                                    \n    {\"endpoint\": \""+svrAddr+"/rfid\", \"status\": \"ok\"}, \
                                    \n    {\"endpoint\": \""+svrAddr+"/player\", \"status\": \"ok\"} \
                            \n  ]\n}\n";
    }
    res.send(responseContent);
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
      var responseContent = "<html><h1>Welcome to fairytale</h1>This is the web \
                          API of fairytale. It is designed to work equally well \
                          or bad for humans and machines \
                          <h2>API endpoints</h2> \
                          <table><tr><td>Endpoint</td><td>Description</td> \
                          <tr><td><a href=\""+svrAddr+"/rfid\">/rfid</a></td><td>for the rfid reader</td></tr> \
                          <tr><td><a href=\""+svrAddr+"/player\">/player</a></td><td>for the mp3 player</td></tr></table></html"
    } else {
      if (DEBUG) console.log("json request");
      var responseContent = "{\"status\": \"info\", \"message\": \"REST API Endpoints\", \
                              \n  \"endpoints\": [ \
                                    \n    {\"endpoint\": \""+svrAddr+"/rfid\", \"description\": \"for the rfid reader\"}, \
                                    \n    {\"endpoint\": \""+svrAddr+"/player\", \"description\": \"for the mp3 player\"} \
                            \n  ]\n}\n"
    }

    res.send(responseContent);
  });

  // the player
  app.get("/player", function(req, res) {
    if (DEBUG) console.log("player entry requested");
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      responseContent = "<html><h1>MP3 Player</h1>Dies ist der Root entry des Players<table> \
                      <tr><td><a href=\""+svrAddr+"/player/play\">play</a></td><td>play a given mp3 file</td></tr> \
                      <tr><td><a href=\""+svrAddr+"/player/stop\">stop</a></td><td>stop playing</td></tr> \
                      <tr><td><a href=\""+svrAddr+"/player/pause\">pause</a></td><td>pause playing</td></tr> \
                      <tr><td><a href=\""+svrAddr+"/player/skip\">skip</a></td><td>skip n number of seconds</td></tr> \
                      <tr><td><a href=\""+svrAddr+"/player/next\">next</a></td><td>jump to next file</td></tr> \
                      <tr><td><a href=\""+svrAddr+"/player/previous\">previous</a></td><td>jump to previous file</td></tr> \
                      </table></html>";
    } else {
      if (DEBUG) console.log("json request");
      responseContent = "{\"status\": \"info\", \"message\": \"MP3 Player REST API Endpoints\", \
                              \n  \"endpoints\": [\
                                            \n    {\"endpoint\": \""+svrAddr+"/player/play\", \"description\": \"play a given mp3 file\"}, \
                                            \n    {\"endpoint\": \""+svrAddr+"/player/stop\", \"description\": \"stop playing\"}, \
                                            \n    {\"endpoint\": \""+svrAddr+"/player/pause\", \"description\": \"pause playing\"}, \
                                            \n    {\"endpoint\": \""+svrAddr+"/player/skip\", \"description\": \"skip n number of seconds\"}, \
                                            \n    {\"endpoint\": \""+svrAddr+"/player/next\", \"description\": \"jump to next file\"}, \
                                            \n    {\"endpoint\": \""+svrAddr+"/player/previous\", \"description\": \"jump to previous file\"} \
                            \n  ]\n}\n"
    }
    res.send(responseContent);
  })

  // play a song, takes a filename as argument in the form of:
  //  localhost:3000/player/play?file=filename.mp3
  app.get("/player/play", function(req, res) {
    if (DEBUG) console.log("player play requested");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    // holds the response data to be send as either html or json
    acceptsHTML;

    if(!req.query.file) {
      console.error("player error: no file provided - provide with ?file=filename.mp3")

      if (acceptsHTML) {
        responseContent = "<html><h1>Error</h1>player error: no file provided - provide with ?file=filename.mp3</html>";
      } else {
        responseContent = "{\"status\": \"error\", \"message\": \"error: no file provided, provide with ?file=filename\"}\n";
      }
    } else {
      var songToPlay=req.query.file;
      // holds the file the player shall play :-)
      var fileToPlay = path.join('data','AudioBooks',songToPlay);

      // TODO: move this into a script in modules directory so that we only deal with the routes here.
      var player = require('play-sound')(opts = {});
      try {
        var audio = player.play(fileToPlay, function(err){
          if (err && !err.killed) {
            console.error("player error: playing file " + fileToPlay);
            if (acceptsHTML) {
              if (DEBUG) console.log("html request");
              responseContent = "player error: playing file " + fileToPlay + "\n" + err.toString();
            } else {
              if (DEBUG) console.log("json request");
              responseContent = "{\"status\": \"error\", \"message\": \"error player file " + fileToPlay + "\"}\n";
            }
            //throw err
          }
        });
      } catch (err) {
        if (acceptsHTML) {
          responseContent = "player error: playing file " + fileToPlay + "\n" + err.toString();
        } else {
          responseContent = "{\"status\": \"error\", \"message\": \"error player file " + fileToPlay + "\"}\n";
        }
      }

      console.log("player: playing " + fileToPlay);
      if (acceptsHTML) {
        responseContent = "player: playing " + fileToPlay;
      } else {
        responseContent = "{\"status\": \"info\", \"message\": \"player playing " + fileToPlay + "\"}\n";
      }
    }

    res.send(responseContent);
  })

  // stop the currently played file
  app.get("/player/stop", function(req, res) {
    if (DEBUG) console.log("player stop requested");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    // holds the response data to be send as either html or json
    var responseContent = "";

    try {
      audio.kill();
    } catch (err) {
      if (acceptsHTML) {
        if (DEBUG) console.log("html request");
        responseContent = "player error: stopping " + fileToPlay + "\n" + err.toString();
      } else {
        if (DEBUG) console.log("json request");
        responseContent = "{\"status\": \"error\", \"message\": \"player error: stopping " + fileToPlay + " -- " + err.toString() + "\"}\n";
      }

      res.send(responseContent);
    }
  })

  // root entry for RFID tag data
  app.get("/rfid", function(req, res) {
    if (DEBUG) console.log("rfid entry requested");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    // holds the response data to be send as either html or json
    var responseContent = "";

    if (acceptsHTML) {
      if (DEBUG) console.log("html request");
      responseContent = "<html><h1>RFID Reader</h1>The API provides access to \
        the RFID reader and also to individual stored tags \
        <h2>Valid Endpoints:</h2> \
        <table><tr><td>Link</td><td>Explanation</td></tr> \
        <tr><td><a href=\""+svrAddr+"/rfid/tags\">/rfid/tags</a></td><td>list all stored rfid tags</td></tr> \
        <tr><td><a href=\""+svrAddr+"/rfid/tags/tag\">/rfid/tags/tag?tag=tag id</td><td>show or update data for one already stored rfid tag</td></tr> \
        <tr><td><a href=\""+svrAddr+"/rfid/tags/tag/create\">/rfid/tags/tag/create</td><td>form to register a new rfid tag</td></tr> \
        </table></html>"
    } else {
      if (DEBUG) console.log("json request");
      responseContent = "{\"endpoints\":\n  [\n    {\"endpoint\": \""+svrAddr+"/rfid/tags\", \"description\": \"list all stored rfid tags\"}, \
                                            \n    {\"endpoint\": \""+svrAddr+"//rfid/tags/tag\", \"description\": \"show/update data for stored rfid tag\"}, \
                                            \n    {\"endpoint\": \""+svrAddr+"//rfid/tags/tag/create\", \"description\": \"create a new rfid tag entry\"} \
                            \n  ]\n}\n"
    }
    res.send(responseContent);
  })

  // get the listing of all stored rfid tags
  app.get("/rfid/tags", function(req, res) {
    if (DEBUG) console.log("list all rfid tags requested");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    // holds the response data to be send as either html or json
    var responseContent = "";

    try {
      fs.readdir(rfidTagDir, function(err, items) {
        if (DEBUG) console.log(items);

        // create a shiny html response content to show in the browser:
        if (acceptsHTML) {
          if (DEBUG) console.log("html request");
          responseContent = "<html><h1>List of all RFID Tags</h1>RFID Tag Files:<table>"
        // or start the json structure
        } else {
          if (DEBUG) console.log("json request");
          responseContent = "{\"tags\":\n  ["
        }

        for (i in items) {
          var tag = items[i].toString().substring(0,items[i].indexOf('.'));
          if (acceptsHTML) {
            responseContent += "<tr><td><a href=\""+svrAddr+"/rfid/tags/tag?tag=" + tag + "\">" + items[i] + "</a></td></tr>";
          } else {
            responseContent += "\n    {\"tag\": \"" + tag + "\", \"endpoint\": \""+svrAddr+"/rfid/tags/tag?tag=" + tag + "\", \"file\": \""+items[i]+"\"}"
            // we only need to add the , after an array element in the json
            // structure, if there are sukzessive elements.
            if (i<items.length-1) responseContent += ",";
          }
        }

        if (acceptsHTML) {
          responseContent += "</table></html>";
        } else {
          responseContent += "\n  ]\n}\n"
        }

        res.send(responseContent);
      });
    } catch (err) {
      console.error("could not read directory "+rfidTagDir+" to list available tags \nException output: " + err.toString());
      if (acceptsHTML) {
        responseContent = "<html><h1>Directory Listing failed</h1><b>could not read directory "+rfidTagDir+" to get list of all available tags</b></html>";
      } else {
        responseContent += "{\"status\": \"error\", \"message\": \"could not read directory " + rfidTagDir + " -- " + err.toString() + "\"}\n";
      }

      res.send(responseContent);
      //process.exit();
    }
  })

  // get the the content of one stored rfid tag
  app.get("/rfid/tags/tag", function(req, res) {
    if (DEBUG) console.log("list content of one rfid tag requested");

    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    // holds the response data to be send as either html or json
    var responseContent = ""

    if(!req.query.tag) {
      console.error("rfid tag error: no tag identifier provided - provide with ?tag=ID")
      if (acceptsHTML) {
        responseContent = "<html><h1>D<h1>Error</h1>rfid tag error: no tag identifier provided - provide with ?tag=ID</html>";
      } else {
        responseContent = "{\"status\": \"error\", \"message\": \"no tag identifier provided\"}\n";
      }
    } else {
      var tag = req.query.tag.toString().toUpperCase();

      // TODO: move this into a script in modules directory so that we only deal with the routes here.
      rfidTagFile = tag + "." + rfidTagFileSuffix;
      // read in the json file and create a javascript object from it
      try {
        var content = fs.readFileSync(path.join(rfidTagDir, rfidTagFile));
        var obj = JSON.parse(content);
      } catch (ex) {
        console.error("could not read data for tag " + tag + " from file " + rfidTagFile + "\nException output: " + ex.toString());
        //process.exit();
        if (acceptsHTML) {
          responseContent = "<html><h1>D<h1>Error</h1>could not read data for tag " + tag + " from file " + rfidTagFile + "\nException output: " + ex.toString() + "</html>";
        } else {
          responseContent = "{\"status\": \"error\", \"message\": \"could not read data for tag " + tag + " from file " + rfidTagFile + "\nException output: " + ex.toString() + "\"}\n";
        }
      }
      var audiobookName = "<h1>" + obj.AbookTitle;

      // check whether or not this is an interactive browser session or a
      // machine to machine communication.
      //    browser means we'll need to send html
      //    machine means we'll send a json structure
      if (acceptsHTML) {
        if (DEBUG) console.log("html request");
        // create a shiny html response content to show in the browser:
        responseContent += audiobookName + "</h1>Available Data:<table>\
                                            <tr><td>RFID Tag ID</td><td>"+tag+"</td></tr>\
                                            <tr><td>RFID Tag File</td><td>"+rfidTagFile+"</td></tr>\
                                            <tr><td>RFID Tag Checksum</td><td>"+obj.Checksum+"</td></tr>\
                                            <tr><td>RFID Tag PreTag</td><td>"+obj.PreTag+"</td></tr>\
                                            <tr><td>RFID Tag Rawdata</td><td>"+obj.RawData+"</td></tr>";


        // for audio and picture files we need to check, whether or not multiple
        // entries are provided in the json file for the tag. In case there are
        // multiple files, it is actually an array.
        // Even more, it could be that we have an array of json structures as
        // opposed to a simple array of elements and we need to deal with that,
        // so that we can provide all files completely and in the correct order
        // to the player.

        // iterate through all provided mp3 files
        responseContent += "<tr><td>.</td><td>.</td></tr>";
        responseContent += "<tr><td>Audio File</td><td>Size</td></tr>";
        if (typeof obj.AbookFileName == "string"){
          responseContent += "<tr><td>" + path.join(audioDataDir,obj.AbookFileName) + "</td></tr>"
        } else {
          for (i in obj.AbookFileName){
            responseContent += "<tr><td>" + path.join(audioDataDir,obj.AbookFileName[i].name) + "</td><td>"+obj.AbookFileName[i].size+"</td></tr>"
          }
        }

        // iterate through all provided picture files
        responseContent += "<tr><td>.</td><td>.</td></tr>";
        responseContent += "</tr><td>Picture File</td><td>Icon</td></tr>";
        if (typeof obj.AbookPicture == "string"){
          responseContent += "<tr><td>" + path.join(coverPicDir,obj.AbookPicture) + "</td><td><img src=\""+ path.join('..','..',coverPicDir,obj.AbookPicture) +"\"></td></tr>";
        } else {
          for (i in obj.AbookFileName){
            responseContent += "<tr><td>" + path.join(coverPicDir,obj.AbookPicture[i].name) + "</td><td><img src=\""+ path.join('..','..',coverPicDir,obj.AbookPicture[i].name) +"\"></td></tr>";
          }
        }

        responseContent += "</table> &nbsp;<h2>Description</h2> "+obj.AbookDescription+"</html>";
      } else {
        if (DEBUG) console.log("json request");
        // in case we shall output JSON it's quite simple, as the stored tag dat ais already json
        responseContent = obj;
      }
    }

    res.send(responseContent);
  })
}

module.exports = appRouter;
