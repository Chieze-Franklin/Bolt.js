var express = require('express');

var apiAppChecksCtrlr = require('../controllers/api-checks');

var router = express.Router();

//gets an array of app objects visible to the user with the specified name, and matching the specified criteria
router.get('/visible-apps/:user', apiAppChecksCtrlr.getAppsForUser)

//checks to see if the user has been granted the permission
router.post('/has-permission', apiAppChecksCtrlr.postHasPermission);

module.exports = router;