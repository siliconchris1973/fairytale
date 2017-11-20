const tagRoutes = require('express').Router();

const create = require('./create');
const picture = require('./picture');
const playdata = require('./playdata');
const tag = require('./tag');

tagRoutes.get('/create', create);
tagRoutes.get('/picture', picture);
tagRoutes.get('/playdata', playdata);
tagRoutes.get('/tag', tag);

module.exports = tagRoutes;
