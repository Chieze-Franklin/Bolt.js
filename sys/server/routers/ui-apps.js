var express = require('express');

var uiAppsCtrlr = require('../controllers/ui-apps');

var router = express.Router();

//this endpoint runs the app with the specified name (using default options)
router.get('/:app', uiAppsCtrlr.getApp);

module.exports = router;