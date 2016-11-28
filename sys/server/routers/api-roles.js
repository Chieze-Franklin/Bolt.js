var express = require('express');

var checksCtrlr = require('../controllers/checks');
var apiRolesCtrlr = require('../controllers/api-roles');

var router = express.Router();

//TODO: DEL: / //usage: ?name=admin

//returns an array of role objects matching the specified criteria
router.get('/', apiRolesCtrlr.get);

//gets the role object with the specified name
router.get('/:role', apiRolesCtrlr.getRole);

//adds a role to the database
router.post('/', checksCtrlr.forSystemApp, apiRolesCtrlr.post);

module.exports = router;