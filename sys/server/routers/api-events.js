var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var apiEventsCtrlr = require('../controllers/api-events');

var router = express.Router();

//publishes an event
router.post('/:name', checksCtrlr.getAppName, apiEventsCtrlr.postEvent);

//subscribes to an event using a transient hook
router.post('/sub/*', checksCtrlr.getAppName, apiEventsCtrlr.postSub);

//deletes a subscription to an event that was made using a transient hook
router.delete('/sub/*', checksCtrlr.getAppName, apiEventsCtrlr.deleteSub);

//TODO: an endpoint for validating events

module.exports = router;