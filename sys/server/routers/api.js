var express = require('express');

var checksCtrlr = require('../controllers/checks');
var apiCtrlr = require('../controllers/api');

var router = express.Router();

router.get('/', apiCtrlr.get);

//TODO: GET: /config //returns the config object (with allowed/public/visible/safe properties)
//TODO: GET: /config/:property //returns the value of a property of the config object (as long as that property is allowed/public/visible/safe to view)

//returns an array of all endpoints, and some extra info
router.get('/help', apiCtrlr.getHelp);

//TODO: GET: /help/:endpoint //returns the description of an endpoint
//TODO: GET: /help/:endpoint/:version //returns the description of a version of an endpoint

router.post('/reset', checksCtrlr.forUserPermToReset, apiCtrlr.postReset);
router.post('/reset/:collection', checksCtrlr.forUserPermToReset, apiCtrlr.postResetCollection);

module.exports = router;