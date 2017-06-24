var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var apiUserRolesCtrlr = require('../controllers/api-user-roles');

var router = express.Router();

//returns an array of user-role objects matching the specified criteria
router.get('/', apiUserRolesCtrlr.get);

//adds a user-role association to the database
router.post('/', checksCtrlr.forSystemApp, apiUserRolesCtrlr.post);

//deletes an array of user-role objects matching the specified criteria
router.delete('/', checksCtrlr.forSystemApp, checksCtrlr.forBulkDeleteCriterion, apiUserRolesCtrlr.delete);

module.exports = router;