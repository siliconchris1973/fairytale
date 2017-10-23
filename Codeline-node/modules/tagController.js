var fs = require('fs');
var path = require('path');
var jsonfile = require('jsonfile');

var getTagList = function(app, callback){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var svrAddr = app.get('svrAddr');
  var rfidTagDir = app.get('rfidTagDir');

  //var DEBUG = debug;
  //var svrAddr = serveradr;
  //var rfidTagDir = directory;

  var responseContent = '';

  try {
    fs.readdir(rfidTagDir, function(err, items) {
      if (DEBUG) console.log('Arbeite Items in Verzeichnis ' + rfidTagDir + ' durch');

      if (err) {
        // irgendein Fehler beim einlesen des Verzeichnisses
        callback('{\'response\': \'error\', \'message\': \'error getting files from directory '+rfidTagDir+'\', \'exception\': \''+err.toString()+'\'}');
      } else if (!items.length) {
        // directory appears to be empty
        console.error("nothing to read in directory "+rfidTagDir);
        callback('{\'response\': \'warning\', \'message\': \'nothing to read from directory '+rfidTagDir+'\'}');
      } else {
        // im Verzeichnis sind tatsaechlich Dateien
        if (DEBUG) console.log('Anzahl Elemente im Verzeichnis '+rfidTagDir+': ' + items.length);
        responseContent = "{\'tags\': ["

        for (i in items) {
          if (items[i].toString().substr(items[i].indexOf('.')) == '.json') {
            if (DEBUG) console.log('Arbeite auf item ' + items[i]);

            // tag-id auslesen, da wir sie gleich brauchen
            var tag = items[i].toString().toUpperCase().substring(0,items[i].indexOf('.'));

            responseContent += "{\'tag\': \'" + tag + "\', \'title\': \'" + tagTitle + "\', \'endpoint\': \'"+svrAddr+"/tags/tag/" + tag + "\', \'file\': \'"+items[i]+"\'}"
            // we only need to add the , after an array element in the json
            // structure, if there are sukzessive elements.
            if (i<items.length-1) responseContent += ",";
          } else {
            if (DEBUG) console.log('ignoring file ' + items[i] + ' as it is not a json file');
          }
        }
        responseContent += "]}"
      }
      if (DEBUG) console.log(responseContent);
      callback(null, responseContent);
    });
  } catch (err) {
    console.error("could not read directory "+rfidTagDir+" to list available tags \nException output: " + err.toString());
    callback('{\'response\': \'error\', \'message\': \'could not read directory '+rfidTagDir+'\', \'exception\': \' '+err.toString()+'\'}');
  }
}

var getTagData = function(app, tagid, callback){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var svrAddr = app.get('svrAddr');
  var rfidTagDir = app.get('rfidTagDir');
  var obj = null;

  var tagStorage = path.join(rfidTagDir, tagid.toUpperCase()+'.json');

  try {
    jsonfile.readFile(tagStorage, function(err, obj) {
      if (err) {
        callback('{\'response\': \'error\', \'message\': \'error getting data of tag '+rfidTagDir+'\', \'error\': \''+err.toString()+'\'}');
      } else {
        //var obj = JSON.parse(fs.readFileSync(tagStorage, 'utf8'));
        if (DEBUG) console.log('getting data for tag ' + tagid + ' from file ' + tagStorage +':');
        if (DEBUG) console.log(obj);
        // auslesen des Titels, da das einfach eine gute informtion ist - packen
        // wir gleich in den ResponseContent mit rein.
        callback(null, obj)
      }
    })
  } catch (err) {
    callback('{\'response\': \'error\', \'message\': \'could not read data for tag '+tagid+' from '+tagStorage+'\', \'exception\': \' '+err.toString()+'\'}');
  }
}

module.exports = {
  getTagList: getTagList,
  getTagData: getTagData
}
