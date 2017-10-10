var path = require('path');
// Read Synchrously
var fs = require("fs");

// in debugging I output to console
var DEBUG=true;

// the rfid tag we want to read
var rfidTag = "75EDB4";

// holds the vars that define the json read/write operation specificas
var json_file_directory = path.join('..','data','rfidTagData');
var json_file_suffix = "json";

var audiobookFilePath = "data/Audiobooks";
var audiobookPicturePath = "data/Cover";

if (DEBUG) {console.log("\n *RFID READER START* \n");}

// get command line argument if script is called from shell
var args = process.argv.slice(2).toString();
if (args.length > 0) {
  if (args.startsWith("tag=")) {
    rfidTag = args.toString().substr(args.indexOf("=") + 1).toUpperCase();
  } else {
    console.log("to pass an RFID tag call with tag=[tagid]");
  }
  if (DEBUG) {console.log("tag is " + rfidTag);}
} else {
  console.log("using fixed demo tag " + rfidTag + ". to pass an RFID tag call with tag=[tagid]");
}

// put together complete file path and name, just so it's easier to handle
var rfidTagFile = path.join(json_file_directory, rfidTag + "." + json_file_suffix);

// read in the json file and create a javascript object from it
try {
  var content = fs.readFileSync(rfidTagFile);
  var obj = JSON.parse(content);
} catch (ex) {
  console.error("could not read tag data for tag " + rfidTag + "\nException output: " + ex.toString());
  process.exit();
}

if (DEBUG) {console.log("Output Content : \n"+ content);}

var audiobookName = obj.AbookTitle;
var audiobookFileName = path.join(audiobookFilePath,obj.AbookFileName);
var audiobookPictureName = path.join(audiobookPicturePath,obj.AbookPicture);

console.log("Audiobook: " + audiobookName);
if (DEBUG) {console.log("     file: " + audiobookFileName + "\n  picture: " +audiobookPictureName);}
if (DEBUG) {console.log("\n *RFID READER EXIT* \n");}
