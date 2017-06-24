var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var apiRolesCtrlr = require('../controllers/api-roles');

var router = express.Router();

//TODO: DEL: / //usage: ?name=admin

//returns an array of role objects matching the specified criteria
router.get('/', apiRolesCtrlr.get);

//gets the role object with the specified name
router.get('/:name', apiRolesCtrlr.getRole);

//adds a role to the database
router.post('/', checksCtrlr.forSystemApp, apiRolesCtrlr.post);

//deletes an array of role objects matching the specified criteria
router.delete('/', checksCtrlr.forSystemApp, checksCtrlr.forBulkDeleteCriterion, apiRolesCtrlr.delete);

//deletes a role from the database
router.delete('/:name', checksCtrlr.forSystemApp, apiRolesCtrlr.deleteRole);

//updates an array of role objects matching the specified criteria
router.put('/', checksCtrlr.forSystemApp, checksCtrlr.forBulkUpdateCriterion, apiRolesCtrlr.put);

//updates a role in the database
router.put('/:name', checksCtrlr.forSystemApp, apiRolesCtrlr.putRole);

module.exports = router;