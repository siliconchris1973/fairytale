var express = require('express'),
  plr = express(),
  port = process.env.PORT || 3002,
  stylus = require('stylus'),
  nib = require('nib');

// these set static exposures for media files and pictures and such
plr.use(express.static('Static'));
plr.use(express.static('../data'));
plr.use(express.static('modules'));
plr.set('/img', express.static('Static/img'));

// settings for the template engine pug
plr.set('/views', express.static('/Views'));
plr.set('view engine', 'pug');


// these settings are made available via plr. get('variable name')
// from within all subsequent scripts
plr.set('rfidTagDir', '../data/TagDB');

// this is for the third node.js app, that does the actual audio playback
plr.set('playerProto', 'http');
plr.set('playerAddr', 'DeepThought');
plr.set('playerPort', Number(3002));
plr.set('playerApi', '/api/v1');
plr.set('playerUrl', '/player');


// and a rather ugly global DEBUG switch
plr.set('DEBUG', true);
// plus another also very ugly TRACE switch
plr.set('TRACE', true);

// set the routes for different part of the application
var playerRoutes = require("./routes/routes_player.js")(plr);

var playerProto = plr.get('playerProto');
var playerAddr = plr.get('playerAddr');
var playerPort = plr.get('playerPort');
var playerApi = plr.get('playerApi');
var playerUrl = plr.get('playerUrl');

var player = plr.listen(playerPort, function () {
    console.log("Player listening on %s://%s:%s API endpoint is %s%s...", playerProto, playerAddr, playerPort, playerApi, playerUrl);
});
