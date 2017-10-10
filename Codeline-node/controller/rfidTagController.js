// rfidTagController.js
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
var rfidTag = require('../modules/rfidTag');
module.exports = router;
