var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var uiAppsCtrlr = require('../controllers/ui-apps');

var router = express.Router();

//this endpoint runs the app with the specified name (using default options)
router.get('/:name', checksCtrlr.forLoggedInUiUser, uiAppsCtrlr.getApp);

module.exports = router;