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
  // the root entry shall show what could be done
  app.get("/", function(req, res) {
    if (DEBUG) console.log("root entry requested");
    // the server checks whether the client accepts html (browser) or
    // json machine to machine communication
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsHTML) {
      var responseContent = "<html><h1>Welcome to fairytale</h1>This is the web \
                          API of fairytale. It is designed to work equally well \
                          or bad for humans and machines \
                          <h2>API endpoints</h2> \
                          <table><tr><td>Endpoint</td><td>Description</td> \
                          <tr><td><a href=\""+svrAddr+"/rfid\">/rfid</a></td><td>for the rfid reader</td></tr> \
                          <tr><td><a href=\""+svrAddr+"/player\">/player</a></td><td>for the mp3 player</td></tr></table></html"
    } else {
      var responseContent = "{\"endpoints\": [{\"endpoint\": \""+svrAddr+"/rfid\", \"description\": \"for the rfid reader\"}, \
                                            {\"endpoint\": \""+svrAddr+"/playrt\", \"description\": \"for the mp3 player\"} \
                            ]}"
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

    res.send("here comes the player");
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
    var responseContent = null;

    if(!req.query.file) {
      console.error("player error: no file provided - provide with ?file=filename.mp3")
      responseContent = "player error: no file provided - provide with ?file=filename.mp3";
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
              responseContent = "player error: playing file " + fileToPlay + "\n" + err.toString();
            } else {
              responseContent = "{\"status\": \"error\", \"message\": \"error player file " + fileToPlay + "\"}";
            }
            //throw err
          }
        });
      } catch (err) {
        if (acceptsHTML) {
          responseContent = "player error: playing file " + fileToPlay + "\n" + err.toString();
        } else {
          responseContent = "{\"status\": \"error\", \"message\": \"error player file " + fileToPlay + "\"}";
        }
      }

      console.log("player: playing " + fileToPlay);
      if (acceptsHTML) {
        responseContent = "player: playing " + fileToPlay;
      } else {
        responseContent = "{\"status\": \"info\", \"message\": \"player playing " + fileToPlay + "\"}";
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
    var responseContent = null;

    try {
      audio.kill();
    } catch (err) {
      if (acceptsHTML) {
        responseContent = "player error: stopping " + fileToPlay + "\n" + err.toString();
      } else {
        responseContent = "{\"status\": \"error\", \"message\": \"player error: stopping " + fileToPlay + " -- " + err.toString() + "\"}";
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
    var responseContent = null;

    if (acceptsHTML) {
      responseContent = "<html><h1>RFID Reader</h1>The API provides access to \
        the RFID reader and also to individual stored tags \
        <h2>Valid Endpoints:</h2> \
        <table><tr><td>Link</td><td>Explanation</td></tr> \
        <tr><td><a href=\""+svrAddr+"/rfid/tags\">/rfid/tags</a></td><td>list all stored rfid tags</td></tr> \
        <tr><td><a href=\""+svrAddr+"/rfid/tags/tag\">/rfid/tags/tag?tag=tag id</td><td>show or update data for one already stored rfid tag</td></tr> \
        <tr><td><a href=\""+svrAddr+"/rfid/tags/tag/create\">/rfid/tags/tag/create</td><td>form to register a new rfid tag</td></tr> \
        </table></html>"
    } else {
      responseContent = "{\"endpoints\": [{\"endpoint\": \""+svrAddr+"/rfid/tags\", \"description\": \"list all stored rfid tags\"}, \
                                            {\"endpoint\": \""+svrAddr+"//rfid/tags/tag\", \"description\": \"show or update data for one already stored rfid tag\"}, \
                                            {\"endpoint\": \""+svrAddr+"//rfid/tags/tag/create\", \"description\": \"create a new rfid tag entry\"} \
                            ]}"
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
    var responseContent = null;

    try {
      fs.readdir(rfidTagDir, function(err, items) {
        if (DEBUG) console.log(items);

        // create a shiny html response content to show in the browser:
        if (acceptsHTML) {
          responseContent = "<html><h1>List of all RFID Tags</h1>RFID Tag Files:<table>"
        // or start the json structure
        } else {
          responseContent = "{\"tags\":["
        }

        for (i in items) {
          var tag = items[i].toString().substring(0,items[i].indexOf('.'));
          if (acceptsHTML) {
            responseContent += "<tr><td><a href=\""+svrAddr+"/rfid/tags/tag?tag=" + tag + "\">" + items[i] + "</a></td></tr>";
          } else {
            responseContent += "{\"tag\": \"" + tag + "\", \"endpoint\": \""+svrAddr+"/rfid/tags/tag?tag=" + tag + "\", \"file\": \""+items[i]+"\"}"
            if (i<items.length-1) responseContent += ",";
          }
        }

        if (acceptsHTML) {
          responseContent += "</table></html>";
        } else {
          responseContent += "]}"
        }

        res.send(responseContent);
      });
    } catch (err) {
      console.error("could not read directory "+rfidTagDir+" to list available tags \nException output: " + err.toString());
      if (acceptsHTML) {
        responseContent = "<html><h1>Directory Listing failed</h1><b>could not read directory "+rfidTagDir+" to get list of all available tags</b></html>";
      } else {
        responseContent += "{\"status\": \"error\", \"message\": \"could not read directory " + rfidTagDir + " -- " + err.toString() + "\"}";
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
    var responseContent = null

    if(!req.query.tag) {
      console.error("rfid tag error: no tag identifier provided - provide with ?tag=ID")
      if (acceptsHTML) {
        responseContent = "<html><h1>D<h1>Error</h1>rfid tag error: no tag identifier provided - provide with ?tag=ID</html>";
      } else {
        responseContent += "{\"status\": \"error\", \"message\": \"no tag identifier provided\"}";
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
      }
      var audiobookName = "<h1>" + obj.AbookTitle;

      // check whether or not this is an interactive browser session or a
      // machine to machine communication.
      //    browser means we'll need to send html
      //    machine means we'll send a json structure
      if (acceptsHTML) {
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
        // in case we shall output JSON it's quite simple, as the stored tag dat ais already json
        responseContent = obj;
      }
    }

    res.send(responseContent);
  })
}

module.exports = appRouter;
