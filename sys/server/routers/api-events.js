var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var apiEventsCtrlr = require('../controllers/api-events');

var router = express.Router();

router.post('/:name', checksCtrlr.getAppName, apiEventsCtrlr.postEvent);

router.post('/sub/*', checksCtrlr.getAppName, apiEventsCtrlr.postSub);

router.delete('/sub/*', checksCtrlr.getAppName, apiEventsCtrlr.deleteSub);

//TODO: an endpoint for validating events

module.exports = router;