var jsonfile = require('jsonfile');
var path = require('path');
var rfidTagData=require('./rfidTagData.js');

var rfidTag = function(app, tagid){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var svrAddr = app.get('svrAddr');
  var rfidTagDir = app.get('rfidTagDir');
  var obj = null;

  var tagStorage = path.join(rfidTagDir, tagid.toUpperCase()+'.json');
    /* This is how a typical rfid tag with data to an audiobook looks like
    {
      "TagChecksum": "0x23",
      "TagId": "75EDB4",
      "TagPreTag": "0xf00",
      "TagRawData": "0F0075EDB423",
      "MediaTitle": "Frederick",
      "MediaDescription": "Ein Hörspiel mit Musik zu Frederick der kleinen Maus",
      "MediaFileName": [{"part": "1", "name": "Frederick.mp3", "size": "24M"}],
      "MediaPicture": [{"pic": "1", "name": "Frederick.jpg"}],
      "MediaType": "Audiobook"
    }
    */

  try {
    jsonfile.readFile(tagStorage, function(err, obj) {
      //var obj = JSON.parse(fs.readFileSync(tagStorage, 'utf8'));
      if (DEBUG) console.log('getting data for tag ' + tagid + ' from file ' + tagStorage +':');
      if (DEBUG) console.log(obj);
    })
  } catch (err) {
    obj = '{\'response\': \'error\', \'message\': \'could not read data for tag '+tagid+' from '+tagStorage+'\', \'exception\': \' '+err.toString()+'\'}' ;
  }
  return obj;
}

module.exports = rfidTag;
