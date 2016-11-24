var express = require('express');

var checksCtrlr = require('../controllers/checks');
var apiAppsCtrlr = require('../controllers/api-apps');

var router = express.Router();

//gets an array of app-info for all installed apps matching the specified criteria
router.get('/', apiAppsCtrlr.get);

//gets an array of context-info of all running contexts
router.get('/@live', apiAppsCtrlr.getLive);

//gets the app info of the app with the specified name
router.get('/:app', apiAppsCtrlr.getApp);

//installs an app from an online repository (current only npm is supported)
router.post('/', checksCtrlr.forUserPermToInstall, checksCtrlr.forAdminRight, apiAppsCtrlr.post);
//TODO: PUT: / //updates an app from an online repository
//TODO: DEL: / //uninstalls an app

//installs (registers) an app from a local repository (current only the node_modules folder is supported)
router.post('/reg', checksCtrlr.forUserPermToInstall, checksCtrlr.forAdminRight, apiAppsCtrlr.postReg);
//TODO: PUT: /reg //updates an app from a local repository
//TODO: DEL: / //unregisters an app

//starts the server of the app with the specified name
router.post('/start', checksCtrlr.forAppRight, apiAppsCtrlr.postStart);

//stops the server of the app with the specified name
router.post('/stop', checksCtrlr.forAppRight, apiAppsCtrlr.postStop);

////gets an array of app-info for all installed apps with the specified tag
//router.get('/:tag', apiAppsCtrlr.getTag);

module.exports = router;