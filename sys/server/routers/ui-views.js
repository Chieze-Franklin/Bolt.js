var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var uiViewsCtrlr = require('../controllers/ui-views');

var router = express.Router();

//this endpoint displays the appropriate view per time
router.get('/', uiViewsCtrlr.get);

//this endpoint displays the download view
router.get('/download', uiViewsCtrlr.getDownload);

//this endpoint displays the install view
router.get('/install', uiViewsCtrlr.getInstall);

//this endpoint displays the login view
router.get('/login', uiViewsCtrlr.getLogin);

//this endpoint displays the logout view
router.get('/logout', uiViewsCtrlr.getLogout);

//this endpoint displays the setup view
router.get('/setup', checksCtrlr.forSystemApp, uiViewsCtrlr.getSetup);

//this endpoint displays the sideload view
router.get('/sideload', uiViewsCtrlr.getSideload);

//this endpoint displays the specified view
router.get('/:view', uiViewsCtrlr.getView);

module.exports = router;