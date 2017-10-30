var player = function(app){
  // get global app variables
  var DEBUG = app.get('DEBUG');
  var TRACE = app.get('TRACE');

  var svrProto = app.get('svrProto');
  var svrAddr = app.get('svrAddr');
  var svrPort = app.get('svrPort');
  var svrApi = app.get('svrApi');

  var playerProto = app.get('playerProto');
  var playerAddr = app.get('playerAddr');
  var playerPort = app.get('playerPort');
  var playerApi = app.get('playerApi');

  app.get("/player", function(req, res){
    res.redirect(playerApi+"/player");
  });
  app.get("/player/:id", function(req, res){
    res.redirect(playerApi+"/player/:id");
  });

}

module.exports = player;
