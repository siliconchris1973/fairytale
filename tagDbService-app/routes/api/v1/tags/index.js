const tagRoutes = require('express').Router();

const welcome = require('./welcome');
const info = require('./info');
const help = require('./help');
const health = require('./health');
const status = require('./status');
const endpoints = require('./endpoints');
const all = require('./all');

tagRoutes.get('/', all);
tagRoutes.get('/list', all);
tagRoutes.get('/welcome', welcome);
tagRoutes.get('/info', info);
tagRoutes.get('/help', help);
tagRoutes.get('/health', health);
tagRoutes.get('/status', status);
tagRoutes.get('/endpoints', endpoints);

module.exports = tagRoutes;
