var path = require('path');
var player = require('play-sound')(opts = {});

// shall we output debug infos?
var DEBUG=true;

// holds the file the player shall play :-)
var fileToPlay = path.join('..','data','AudioBooks','goldenegans.mp3');

if (DEBUG) {console.log("\n *PLAYER START* \n");}

// get command line argument if script is called from shell
var args = process.argv.slice(2).toString();
if (args.length > 0) {
  if (args.startsWith("file=")) {
    fileToPlay = args.toString().substr(args.indexOf("=") + 1);
    var audio = player.play(fileToPlay, function(err){
      if (DEBUG) {console.log("now playing file " + fileToPlay);}
      if (err && !err.killed) {
        console.error("error playing file " + fileToPlay);
        throw err
      }
    });
  } else if(args=='demon') {
    console.log("running as a demon, which doesn't make any sense right now");
    while(true){
      // do something good here
    }
  } else if (args=='demo') {
    console.log("using fixed demo file " + fileToPlay + " - to pass a file to play call with file=[path to file]");
  } else {
    // console output to display usage
    console.log("player.js [demo|demon|file=path to file]\n\n[USAGE]\nto run in demo mode call with \'demo\'\nto start demon process, call with \'demon\'. \nto pass a file to play, call with file=[filepath].\n");
  }
  if (DEBUG) {console.log("selected file to play is " + fileToPlay);}
} else {
  // console output to display usage
  console.log("player.js [demo|demon|file=path to file]\n\n[USAGE]\nto run in demo mode call with \'demo\'\nto start demon process, call with \'demon\'. \nto pass a file to play, call with file=[filepath].\n");
}

// this function is used as the route endpoint

exports.play = function(req, res) {
  // access the node child_process in case you need to kill it on demand
  var audio = player.play(fileToPlay, function(err){
    if (DEBUG) {console.log("now playing file " + fileToPlay);}
    if (err && !err.killed) {
      console.error("error playing file " + fileToPlay);
      throw err
    }
  });
};

exports.stop = function(req, res) {
  audio.kill;
  /*
  if (err && !err.killed) {
    console.error("error playing file " + fileToPlay);
    throw err
  }
  */
};



if (DEBUG) {console.log("\n *PLAYER EXIT* \n");}
