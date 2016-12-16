var express = require('express');

var apiAppChecksCtrlr = require('../controllers/api-checks');

var router = express.Router();

//checks to see if the user has right to start the app (or access the app's feature) (or access the app's file)
router.post('/app-right', apiAppChecksCtrlr.postAppRight);

module.exports = router;