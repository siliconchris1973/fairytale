const app = require('express').Router();

const welcome = require('./welcome');
const endpoints = require('./endpoints');
const status = require('./status');
const info = require('./info');

app.get('/', welcome);
app.get('/welcome', welcome);
app.get('/endpoints', endpoints);
app.get('/info', info);
app.get('/status', status);

module.exports = app;
