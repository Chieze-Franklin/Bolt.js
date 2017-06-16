var express = require('express');

var apiAppChecksCtrlr = require('../controllers/api-checks');

var router = express.Router();

//gets an array of app objects visible to the user with the specified name, and matching the specified criteria
router.get('visible-apps/:user', apiAppChecksCtrlr.getAppsForUser)

//checks to see if the user has right to start the app (or access the app's feature) (or access the app's file)
router.post('/app-right', apiAppChecksCtrlr.postAppRight);

module.exports = router;