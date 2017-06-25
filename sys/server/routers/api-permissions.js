var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var apiPermissionsCtrlr = require('../controllers/api-permissions');

var router = express.Router();

//returns an array of permission objects matching the specified criteria
router.get('/', apiPermissionsCtrlr.get);

module.exports = router;