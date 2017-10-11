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
                                    <tr><td><a href=\""+svrAddr+"/tags\">/tags</a></td><td>ok</td></tr> \
                                    <tr><td><a href=\""+svrAddr+"/player\">/player</a></td><td>ok</td></tr> \
                                  </table> \
                                </html>";
            res.send(responseContent);
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
            var responseContent = "<html><h1>Welcome to fairytale</h1>This is the web \
                              API of fairytale. It is designed to work equally well \
                              or bad for humans and machines \
                              <h2>API endpoints</h2> \
                              <table><tr><td>Endpoint</td><td>Description</td> \
                              <tr><td><a href=\""+svrAddr+"/tags\">/tags</a></td><td>for the rfid tags</td></tr> \
                              <tr><td><a href=\""+svrAddr+"/rfid\">/rfid</a></td><td>for the rfid reader</td></tr> \
                              <tr><td><a href=\""+svrAddr+"/player\">/player</a></td><td>for the mp3 player</td></tr></table></html"
            res.send(responseContent);
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

    // the player
    app.get("/player", function(req, res) {
        if (DEBUG) console.log("player entry requested");
        // the server checks whether the client accepts html (browser) or
        // json machine to machine communication
        var acceptsHTML = req.accepts('html');
        var acceptsJSON = req.accepts('json');

        if (acceptsHTML) {
            if (DEBUG) console.log("html request");
            responseContent = "<html><h1>mp3 Player</h1>root entry of the mp3 Player API<table> \
                          <tr><td><a href=\""+svrAddr+"/player/play\">play</a></td><td>play a given mp3 file</td></tr> \
                          <tr><td><a href=\""+svrAddr+"/player/stop\">stop</a></td><td>stop playing - only available in case a file is played</td></tr> \
                          <tr><td><a href=\""+svrAddr+"/player/pause\">pause</a></td><td>pause playback - only available in case a file is played</td></tr> \
                          <tr><td><a href=\""+svrAddr+"/player/skip\">skip</a></td><td>skip 10 seconds of played file - only available in case a file is played</td></tr> \
                          <tr><td><a href=\""+svrAddr+"/player/next\">next</a></td><td>jump to next file for currently played album</td></tr> \
                          <tr><td><a href=\""+svrAddr+"/player/prev\">previous</a></td><td>jump to previous file of currently played album</td></tr> \
                          </table></html>";
            res.send(responseContent);
        } else {
            if (DEBUG) console.log("json request");
            res.json({
                response: 'REST API for the mp3 Player',
                endpoints: [
                    {endpoint: svrAddr+'/player', description: 'the root entry of the mp3 player API'},
                    {endpoint: svrAddr+'/player/play', description: 'play a given mp3 file'},
                    {endpoint: svrAddr+'/player/stop', description: 'stop playing - only available in case a file is played'},
                    {endpoint: svrAddr+'/player/pause', description: 'pause playback - only available in case a file is played'},
                    {endpoint: svrAddr+'/player/skip', description: 'skip 10 seconds of played file - only available in case a file is played'},
                    {endpoint: svrAddr+'/player/next', description: 'jump to next file for currently played album'},
                    {endpoint: svrAddr+'/player/prev', description: 'jump to previous file of currently played album'}
                ]
            });
        }
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
                res.send(responseContent);
            } else {
                res.json({response: 'error', message: 'no file provided, provide with ?file=filename'});
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
                            res.send(responseContent);
                        } else {
                            if (DEBUG) console.log("json request");
                            res.json({response: 'error', message: 'error playing file '+fileToPlay, exception: err.toString});
                        }
                        //throw err
                    }
                });
            } catch (err) {
                if (acceptsHTML) {
                    responseContent = "player error: playing file " + fileToPlay + "\n" + err.toString();
                    res.send(responseContent);
                } else {
                    res.json({response: 'error', message: 'error playing file '+fileToPlay, exception: err.toString});
                }
            }

            console.log("player: playing " + fileToPlay);
            if (acceptsHTML) {
                responseContent = "player: playing " + fileToPlay;
                res.send(responseContent);
            } else {
                res.json({response: 'info', message: 'playing file '+fileToPlay});
            }
        }
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
            if (acceptsHTML) {
                if (DEBUG) console.log("html request");
                responseContent = "player info: player stopped";
                res.send(responseContent);
            } else {
                if (DEBUG) console.log("json request");
                res.json({response: 'info', message: 'playback of file '+fileToPlay + ' stopped'});
            }
        } catch (err) {
            if (acceptsHTML) {
                if (DEBUG) console.log("html request");
                responseContent = "player error: stopping " + fileToPlay + "\n" + err.toString();
                res.send(responseContent);
            } else {
                if (DEBUG) console.log("json request");
                res.json({response: 'error', message: 'error stopping playback of file '+fileToPlay, exception: err.toString});
            }
        }
    })

    // skip n number of seconds of currently played file
    app.get("/player/skip", function(req, res) {
        if (DEBUG) console.log("player skip requested");

        // the server checks whether the client accepts html (browser) or
        // json machine to machine communication
        var acceptsHTML = req.accepts('html');
        var acceptsJSON = req.accepts('json');

        // holds the response data to be send as either html or json
        var responseContent = "";
        if(!req.query.seconds) {
            console.error("player error: you must provide number of seconds to skip - provide with ?seconds=number of seconds")

            if (acceptsHTML) {
                responseContent = "<html><h1>Error</h1>player error: you must provide number of seconds to skip - provide with ?seconds=number of seconds</html>";
                res.send(responseContent);
            } else {
                res.json({response: 'error', message: 'you must provide number of seconds to skip - provide with ?seconds=number of seconds'});
            }
        } else {
            var numberOfSeconds = req.query.seconds;
            try {
                // TODO implement function to skip n seconds;
                if (acceptsHTML) {
                    if (DEBUG) console.log("html request");
                    responseContent = "<html><h1>Info</h1>player info: skipped "+numberOfSeconds+" seconds</html>";
                    res.send(responseContent);
                } else {
                    if (DEBUG) console.log("json request");
                    res.json({response: 'info', message: 'skipped '+numberOfSeconds + ' seconds'});
                }
            } catch (err) {
                if (acceptsHTML) {
                    if (DEBUG) console.log("html request");
                    responseContent = "<html><h1>Error</h1>player error: skipping "+numberOfSeconds+" seconds of file " + fileToPlay + "failed\n" + err.toString() + "</html>";
                    res.send(responseContent);
                } else {
                    if (DEBUG) console.log("json request");
                    res.json({response: 'error', message: 'error skipping '+numberOfSeconds+' seconds of file '+fileToPlay, exception: err.toString});
                }
            }
        }
    })

    // play next file of current album
    app.get("/player/next", function(req, res) {
        if (DEBUG) console.log("player next requested");

        // the server checks whether the client accepts html (browser) or
        // json machine to machine communication
        var acceptsHTML = req.accepts('html');
        var acceptsJSON = req.accepts('json');

        // holds the response data to be send as either html or json
        var responseContent = "";
        /*
        if(!req.query.seconds) {
            console.error("player error: you must provide number of seconds to skip - provide with ?seconds=number of seconds")

            if (acceptsHTML) {
                responseContent = "<html><h1>Error</h1>player error: you must provide number of seconds to skip - provide with ?seconds=number of seconds</html>";
                res.send(responseContent);
            } else {
                res.json({response: 'error', message: 'you must provide number of seconds to skip - provide with ?seconds=number of seconds'});
            }
        } else {
        */
            //var numberOfSeconds = req.query.seconds;
            try {
                // TODO implement function to jump to next file
                if (acceptsHTML) {
                    if (DEBUG) console.log("html request");
                    responseContent = "<html><h1>Info</h1>player info: jumping to next file</html>";
                    res.send(responseContent);
                } else {
                    if (DEBUG) console.log("json request");
                    res.json({response: 'info', message: 'jumping to next file'});
                }
            } catch (err) {
                if (acceptsHTML) {
                    if (DEBUG) console.log("html request");
                    responseContent = "<html><h1>Error</h1>player error: jumping to next file failed\n" + err.toString() + "</html>";
                    res.send(responseContent);
                } else {
                    if (DEBUG) console.log("json request");
                    res.json({response: 'error', message: 'jumping to next file failed', exception: err.toString});
                }
            }
        //}
    })

    // play next file of current album
    app.get("/player/prev", function(req, res) {
        if (DEBUG) console.log("player prev requested");

        // the server checks whether the client accepts html (browser) or
        // json machine to machine communication
        var acceptsHTML = req.accepts('html');
        var acceptsJSON = req.accepts('json');

        // holds the response data to be send as either html or json
        var responseContent = "";
        /*
        if(!req.query.seconds) {
            console.error("player error: you must provide number of seconds to skip - provide with ?seconds=number of seconds")

            if (acceptsHTML) {
                responseContent = "<html><h1>Error</h1>player error: you must provide number of seconds to skip - provide with ?seconds=number of seconds</html>";
                res.send(responseContent);
            } else {
                res.json({response: 'error', message: 'you must provide number of seconds to skip - provide with ?seconds=number of seconds'});
            }
        } else {
        */
            //var numberOfSeconds = req.query.seconds;
            try {
                // TODO implement function to jump to next file
                if (acceptsHTML) {
                    if (DEBUG) console.log("html request");
                    responseContent = "<html><h1>Info</h1>player info: jumping to previous file</html>";
                    res.send(responseContent);
                } else {
                    if (DEBUG) console.log("json request");
                    res.json({response: 'info', message: 'jumping to previous file'});
                }
            } catch (err) {
                if (acceptsHTML) {
                    if (DEBUG) console.log("html request");
                    responseContent = "<html><h1>Error</h1>player error: jumping to previous file failed\n" + err.toString() + "</html>";
                    res.send(responseContent);
                } else {
                    if (DEBUG) console.log("json request");
                    res.json({response: 'error', message: 'jumping to previous file failed', exception: err.toString});
                }
            }
        //}
    })


    // root entry for RFID tag data
    app.get("/tags", function(req, res) {
        if (DEBUG) console.log("tags entry info requested");

        // the server checks whether the client accepts html (browser) or
        // json machine to machine communication
        var acceptsHTML = req.accepts('html');
        var acceptsJSON = req.accepts('json');

        // holds the response data to be send as either html or json
        var responseContent = "";

        if (acceptsHTML) {
            if (DEBUG) console.log("html request");
            responseContent = "<html><h1>RFID tag API</h1>The API provides access to RFID tags \
                                <h2>Valid Endpoints:</h2> \
                                <table><tr><td>Link</td><td>Explanation</td></tr> \
                                <tr><td><a href=\""+svrAddr+"/tags\">/tags</a></td><td>this info page</td></tr> \
                                <tr><td><a href=\""+svrAddr+"/tags\">/tags/list</a></td><td>list all stored rfid tags</td></tr> \
                                <tr><td><a href=\""+svrAddr+"/tags/tag\">/tags/tag?tag=tag id</td><td>show, create, update or delete data entry an rfid tag</td></tr> \
                                <tr><td><a href=\""+svrAddr+"/tags/tag/create\">/tags/tag/create</td><td>form to register a new rfid tag (uses POST to "+svrAddr+"/tags/tag internally)</td></tr> \
                                </table></html>"
            res.send(responseContent);
        } else {
            if (DEBUG) console.log("json request");
            res.json({
                response: 'info endpoint to tags API',
                endpoints: [
                    {endpoint: svrAddr+'/tags/list', description: 'list all stored rfid tags'},
                    {endpoint: svrAddr+'/tags/tag', description: 'show (GET), create (POST), update (PATCH/PUT) or delete (DELETE) a provided rfid tag data entry'}
                ]
            });
        }
    })

    // get the listing of all stored rfid tags
    app.get("/tags/list", function(req, res) {
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
                    responseContent = "response: info, description: list of all stored rfid tags, tags: ["
                }

                for (i in items) {
                    var tag = items[i].toString().substring(0,items[i].indexOf('.'));
                    if (acceptsHTML) {
                        responseContent += "<tr><td><a href=\""+svrAddr+"/tags/tag?tag=" + tag + "\">" + items[i] + "</a></td></tr>";
                    } else {
                        responseContent += "{tag: " + tag + ", endpoint: "+svrAddr+"/tags/tag?tag=" + tag + ", file: "+items[i]+"}"
                        // we only need to add the , after an array element in the json
                        // structure, if there are sukzessive elements.
                        if (i<items.length-1) responseContent += ",";
                    }
                }

                if (acceptsHTML) {
                    responseContent += "</table></html>";
                    res.send(responseContent);
                } else {
                    responseContent += "]}"
                    res.json(responseContent);
                }
            });
        } catch (err) {
            console.error("could not read directory "+rfidTagDir+" to list available tags \nException output: " + err.toString());
            if (acceptsHTML) {
                responseContent = "<html><h1>Directory Listing failed</h1><b>could not read directory "+rfidTagDir+" to get list of all available tags</b></html>";
                res.send(responseContent);
            } else {
                res.json({response: 'error', message: 'could not read directory '+rfidTagDir, exception: err.toString()});
            }
            //process.exit();
        }
    })

    // get the the content of one stored rfid tag
    app.get("/tags/tag", function(req, res) {
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
                responseContent = "<html><h1>Error</h1>rfid tag error: no tag identifier provided - provide with ?tag=ID</html>";
            } else {
                responseContent = "{\"status\": \"error\", \"message\": \"no tag identifier provided - provide with ?tag=ID\"}\n";
            }
        } else {
            var tag = req.query.tag.toString().toUpperCase();

            // TODO: move this into a script in modules directory so that we only deal with the routes here.
            rfidTagFile = tag + "." + rfidTagFileSuffix;
            // read in the json file and create a javascript object from it
            try {
                var content = fs.readFileSync(path.join(rfidTagDir, rfidTagFile));
                var obj = JSON.parse(content);

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
            } catch (ex) {
                console.error("could not read data for tag " + tag + " from file " + rfidTagFile + "\nException output: " + ex.toString());
                //process.exit();
                if (acceptsHTML) {
                    responseContent = "<html><h1>Error</h1>could not read data for tag " + tag + " from file " + rfidTagFile + "\n<h2>Exception</h2>" + ex.toString() + "</html>";
                } else {
                    responseContent = "{\"status\": \"error\", \"message\": \"could not read data for tag " + tag + " from file " + rfidTagFile + "\nException: " + ex.toString() + "\"}\n";
                }
            }
        }
        res.send(responseContent);
    })
}

module.exports = appRouter;
