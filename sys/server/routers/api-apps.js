var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var apiAppsCtrlr = require('../controllers/api-apps');

var router = express.Router();

//TODO: DEL: /:app //uninstalls an app (remember to delete app-user, app-role, extensions, routers, collections, hooks, public files...)
router.delete('/', checksCtrlr.forSystemApp, checksCtrlr.forAdminRight, apiAppsCtrlr.delete);
router.delete('/:name', checksCtrlr.forSystemApp, checksCtrlr.forAdminRight, apiAppsCtrlr.deleteApp);

//gets an array of app objects for all installed apps matching the specified criteria
router.get('/', apiAppsCtrlr.get);

//gets an array of context objects of all running contexts
router.get('/@live', apiAppsCtrlr.getLive);

//gets the app object of the app with the specified name
router.get('/:name', apiAppsCtrlr.getApp);

//installs an app from an online repository (current only npm is supported)
router.post('/', checksCtrlr.forSystemApp, checksCtrlr.forAdminRight, apiAppsCtrlr.post);
//TODO: PUT: /:app //updates an app from an online repository (delete existing folder from node_modules first; do not touch public files and collections)

//returns the package.json of an app from an online repository (current only npm is supported)
router.post('/package', checksCtrlr.forAdminRight, apiAppsCtrlr.postPackage);

//returns the readme.md of an app from an online repository (current only npm is supported)
router.post('/readme', checksCtrlr.forAdminRight, apiAppsCtrlr.postReadme);

//installs an app from a local repository (current only the node_modules folder is supported)
router.post('/local', checksCtrlr.forSystemApp, checksCtrlr.forAdminRight, apiAppsCtrlr.postLocal);
//TODO: PUT: /local/:app //updates an app from a local repository (do NOT delete existing folder from node_modules; do not touch public files and collections)

//returns the package.json of an app from a local repository (current only the node_modules folder is supported)
router.post('/local-package', checksCtrlr.forAdminRight, apiAppsCtrlr.postLocalPackage);

//returns the readme.md of an app from a local repository (current only the node_modules folder is supported)
router.post('/local-readme', checksCtrlr.forAdminRight, apiAppsCtrlr.postLocalReadme);

//starts the server of the app with the specified name
router.post('/start', apiAppsCtrlr.postStart);

//stops the server of the app with the specified name
router.post('/stop', apiAppsCtrlr.postStop);

////gets an array of app objects for all installed apps with the specified tag
//router.get('/:tag', apiAppsCtrlr.getTag);

module.exports = router;