var fs = require('fs');
var path = require('path');
var jsonfile = require('jsonfile');

// the player itself
console.log('calling thePlayer')
var thePlayer = require('../modules/thePlayer.js');
// startup sound
var f = '../static/sounds/schulglocke-3-mal.mp3';
myPlr = new thePlayer(f, 0);
myPlr.playTrack();
