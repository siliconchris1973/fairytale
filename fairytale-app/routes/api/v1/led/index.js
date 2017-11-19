const led = require('express').Router();

const welcome = require('./welcome');
const endpoints = require('./endpoints');
const status = require('./status');
const info = require('./info');
//const blink = require('./blink');

led.get('/', welcome);
led.get('/welcome', welcome);
led.get('/endpoints', endpoints);
led.get('/info', info);
led.get('/status', status);
//led.get('/blink', blink);

module.exports = led;
