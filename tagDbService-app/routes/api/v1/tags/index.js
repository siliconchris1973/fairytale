const tagRoutes = require('express').Router();

const welcome = require('./welcome');
const endpoints = require('./endpoints');
const status = require('./status');
const info = require('./info');
const tag = require('./tag');
const all = require('./all');

tagRoutes.get('/', all);
tagRoutes.get('/welcome', welcome);
tagRoutes.get('/endpoints', endpoints);
tagRoutes.get('/info', info);
tagRoutes.get('/tag', tag);

module.exports = tagRoutes;
