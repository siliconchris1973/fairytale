var rfidTagData = function(tagData){
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
    var TagChecksum //: String,
    var TagId //: String,
    var TagPreTag //: String,
    var TagRawData //: String,
    var MediaTitle //: String,
    var MediaType //: String,
    var MediaDescription //: String,
    var MediaFileName //: String[],
    var MediaPicture //: String[]

    if (!tagData.TagChecksum.length) {
      TagChecksum = null;
    } else {
      TagChecksum = tagData.TagChecksum;
    }

    if (!tagData.TagId.length) {
      TagId = null;
    } else {
      TagId = tagData.TagId;
    }

    if (!tagData.TagId.length) {
      TagPreTag = null;
    } else {
      TagPreTag = tagData.TagId;
    }

    if (!tagData.TagRawData.length) {
      TagRawData = null;
    } else {
      TagRawData = tagData.TagRawData;
    }

    if (!tagData.MediaTitle.length) {
      MediaTitle = null;
    } else {
      MediaTitle = tagData.MediaTitle;
    }

    if (!tagData.MediaType.length) {
      MedaType = null;
    } else {
      MedaType = tagData.MediaType;
    }

    if (!tagData.MediaDescription.length) {
      MediaDescription = null;
    } else {
      MediaDescription = tagData.MediaDescription;
    }

    if (!tagData.MediaFileName.length) {
      MediaFileName = null;
    } else {
      MediaFileName = tagData.MediaFileName;
    }

    if (!tagData.MediaPicture.length) {
      MediaPicture = null;
    } else {
      MediaPicture = tagData.MediaPicture;
    }

}

module.exports = rfidTagData;
