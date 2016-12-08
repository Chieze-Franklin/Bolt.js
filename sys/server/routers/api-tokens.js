var express = require('express');

var checksCtrlr = require('../controllers/checks');
var apiTokensCtrlr = require('../controllers/api-tokens');

var router = express.Router();

//returns the object with the given token
router.get('/:token', apiTokensCtrlr.getObject);

//returns a token for the POSTed object
router.post('/', checksCtrlr.forSystemApp, apiTokensCtrlr.post);

module.exports = router;