var express = require('express');

var checksCtrlr = require('../controllers/checks');
var apiUserRolesCtrlr = require('../controllers/api-user-roles');

var router = express.Router();

//TODO: DEL: / //usage: ?user=frank

//returns an array of user-role objects matching the specified criteria
router.get('/', apiUserRolesCtrlr.get);

//adds a user-role association to the database
router.post('/', checksCtrlr.forSystemApp, apiUserRolesCtrlr.post);

module.exports = router;