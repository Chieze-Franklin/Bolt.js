var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var apiAppUsersCtrlr = require('../controllers/api-app-users');

var router = express.Router();

//returns an array of app-user objects matching the specified criteria
router.get('/', apiAppUsersCtrlr.get);

//adds an app-user association to the database
router.post('/', checksCtrlr.forSystemApp, apiAppUsersCtrlr.post);

//deletes an array of app-user objects matching the specified criteria
router.delete('/', checksCtrlr.forSystemApp, apiAppUsersCtrlr.delete);

module.exports = router;