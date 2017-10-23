var rfidTag = function(app, tagid){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var svrAddr = app.get('svrAddr');

  // rfidtag.js
  var mongoose = require('mongoose');
  var rfidTagSchema = new mongoose.Schema({
    /* This is how a typical rfid tag with data to an audiobook looks like
    {
      "Checksum": "0x23",
      "TagId": "75EDB4",
      "PreTag": "0xf00",
      "RawData": "0F0075EDB423",
      "AbookTitle": "Frederick",
      "AbookDescription": "Ein Hörspiel mit Musik zu Frederick der kleinen Maus",
      "AbookFileName": [{"part": "1", "name": "Frederick.mp3", "size": "24M"}],
      "AbookPicture": [{"pic": "1", "name": "Frederick.jpg"}]
    }
    */
    Checksum: String,
    TagId: String,
    PreTag: String,
    RawData: String,
    MediaTitle: String,
    MediaType: String,
    MediaDescription: String,
    MediaFileName: String[],
    CoverPicture: String[]
  });
}
mongoose.model('rfidTag', rfidTagSchema);
module.exports = mongoose.model('rfidTag');
