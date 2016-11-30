var express = require('express');

var checksCtrlr = require('../controllers/checks');
var apiAppRolesCtrlr = require('../controllers/api-app-roles');

var router = express.Router();

//TODO: DEL: / //usage: ?app=settings&role=admin

//returns an array of app-role objects matching the specified criteria
router.get('/', apiAppRolesCtrlr.get);

//adds an app-role association to the database
router.post('/', checksCtrlr.forSystemApp, apiAppRolesCtrlr.post);

//deletes an array of app-role objects matching the specified criteria
router.delete('/', checksCtrlr.forSystemApp, apiAppRolesCtrlr.delete);

module.exports = router;