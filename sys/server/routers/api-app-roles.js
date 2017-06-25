var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var apiAppRolesCtrlr = require('../controllers/api-app-roles');

var router = express.Router();

//returns an array of app-role objects matching the specified criteria
router.get('/', apiAppRolesCtrlr.get);

//adds an app-role association to the database
router.post('/', checksCtrlr.forSystemApp, apiAppRolesCtrlr.post);

//deletes an array of app-role objects matching the specified criteria
router.delete('/', checksCtrlr.forSystemApp, checksCtrlr.forBulkDeleteCriterion, apiAppRolesCtrlr.delete);

//updates an array of app-role objects matching the specified criteria
router.put('/', checksCtrlr.forSystemApp, checksCtrlr.forBulkUpdateCriterion, apiAppRolesCtrlr.put);

module.exports = router;