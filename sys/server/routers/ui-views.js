var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var uiViewsCtrlr = require('../controllers/ui-views');

var router = express.Router();

//this endpoint displays the appropriate view per time
router.get('/', uiViewsCtrlr.get);

//this endpoint displays the download view
router.get('/download', checksCtrlr.forLoggedInUiUser, uiViewsCtrlr.getDownload);

//this endpoint displays the install view
router.get('/install', checksCtrlr.forLoggedInUiUser, uiViewsCtrlr.getInstall);

//this endpoint displays the login view
router.get('/login', uiViewsCtrlr.getLogin);

//this endpoint displays the logout view
router.get('/logout', uiViewsCtrlr.getLogout);

//this endpoint displays the setup view
router.get('/setup', checksCtrlr.forSystemApp, uiViewsCtrlr.getSetup);

//this endpoint displays the sideload view
router.get('/sideload', checksCtrlr.forLoggedInUiUser, uiViewsCtrlr.getSideload);

//this endpoint displays the uninstall view
router.get('/uninstall', checksCtrlr.forLoggedInUiUser, uiViewsCtrlr.getUninstall);

//this endpoint displays the update view
router.get('/update', checksCtrlr.forLoggedInUiUser, uiViewsCtrlr.getUpdate);

//this endpoint displays the specified view
router.get('/:view', checksCtrlr.forLoggedInUiUser, uiViewsCtrlr.getView);

module.exports = router;