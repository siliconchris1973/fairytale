const player = require('express').Router();

const welcome = require('./welcome');
const endpoints = require('./endpoints');
const status = require('./status');
const info = require('./info');
const help = require('./help');
const health = require('./health');
const play = require('./play');
/*
const pause = require('./pause');
const stop = require('./stop');
const skip = require('./skip');
const rewind = require('./rewind');
const forward = require('./forward');
const next = require('./next');
const prev = require('./prev');
*/

player.get('/', welcome);
player.get('/welcome', welcome);
player.get('/endpoints', endpoints);
player.get('/status', status);
player.get('/info', info);
player.get('/help', help);
player.get('/health', health);
player.get('/play', play);
/*
player.get('/pause', pause);
player.get('/stop', stop);
player.get('/skip', skip);
player.get('/rewind', rewind);
player.get('/forward', forward);
player.get('/next', next);
player.get('/prev', prev);
*/
module.exports = player;
