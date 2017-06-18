var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var xBoltCtrlr = require('../controllers/x-bolt');

var router = express.Router();

//listens for when an app is deleted
router.post('/hooks/bolt/app-deleted', xBoltCtrlr.postHooksBoltAppDeleted);

//listens for when an external router is loaded
router.post('/hooks/bolt/app-router-loaded', xBoltCtrlr.postHooksBoltAppRouterLoaded);

//listens for when an app is started
router.post('/hooks/bolt/app-started', xBoltCtrlr.postHooksBoltAppStarted);

//listens for when a role is deleted
router.post('/hooks/bolt/role-deleted', xBoltCtrlr.postHooksBoltRoleDeleted);

//listens for when a user is deleted
router.post('/hooks/bolt/user-deleted', xBoltCtrlr.postHooksBoltUserDeleted);

module.exports = router;