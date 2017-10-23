var db = function(app){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var svrAddr = app.get('svrAddr');
  var dataDir = app.get('dataDir');
  var mediaDir = app.get('mediaDir');
  
  // db.js
  var mongoose = require('mongoose');

  try {
    var promise = mongoose.connect('mongodb://127.0.0.1:32771', {
      useMongoClient: true,
      user: 'admin',
      pass: 'LjiRDd81uFYE'
      /* other options */
    });
  } catch (ex) {
    console.error("db error: connection to database unsuccessful");
  }
}

module.exports = db;
