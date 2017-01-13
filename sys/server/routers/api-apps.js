var express = require('express');

var checksCtrlr = require('../controllers/checks');
var apiAppsCtrlr = require('../controllers/api-apps');

var router = express.Router();

//gets an array of app objects for all installed apps matching the specified criteria
router.get('/', apiAppsCtrlr.get);

//gets an array of context objects of all running contexts
router.get('/@live', apiAppsCtrlr.getLive);

//gets the app object of the app with the specified name
router.get('/:name', apiAppsCtrlr.getApp);

//installs an app from an online repository (current only npm is supported)
router.post('/', checksCtrlr.forUserPermToInstall, checksCtrlr.forAdminRight, apiAppsCtrlr.post);
//TODO: PUT: /:app //updates an app from an online repository
//TODO: DEL: /:app //uninstalls an app (remember to delete app-user, app-role, plugins, modules, collections, listeners...)

//TODO: POST /package //call this before POST: / to get the package.json of the app so important info can be shown to the user before installation

//installs (registers) an app from a local repository (current only the node_modules folder is supported)
router.post('/reg', checksCtrlr.forUserPermToInstall, checksCtrlr.forAdminRight, apiAppsCtrlr.postReg);
//TODO: PUT: /reg/:app //updates an app from a local repository
//TODO: DEL: /reg/:app //unregisters an app (remember to delete app-user, app-role, plugins, modules, collections, listeners...)

//returns the relevant package.json of an app from a local repository (current only the node_modules folder is supported)
router.post('/reg-package', checksCtrlr.forAdminRight, apiAppsCtrlr.postRegPackage);

//starts the server of the app with the specified name
router.post('/start', checksCtrlr.forAppRight, apiAppsCtrlr.postStart);

//stops the server of the app with the specified name
router.post('/stop', checksCtrlr.forAppRight, apiAppsCtrlr.postStop);

////gets an array of app objects for all installed apps with the specified tag
//router.get('/:tag', apiAppsCtrlr.getTag);

module.exports = router;