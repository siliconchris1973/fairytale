const nfc = require('express').Router();

const welcome = require('./welcome');
const endpoints = require('./endpoints');
const status = require('./status');
const info = require('./info');

nfc.get('/', welcome);
nfc.get('/welcome', welcome);
nfc.get('/endpoints', endpoints);
nfc.get('/info', info);
nfc.get('/status', status);

module.exports = nfc;
