var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));

var player_routes = require('../routes/routes_player.js')

module.exports = router;
