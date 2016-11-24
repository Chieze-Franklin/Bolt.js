var express = require('express');

var apiAppChecksCtrlr = require('../controllers/api-checks');

var router = express.Router();

//checks to see if the user has right to start the app
router.post('/user-app', apiAppChecksCtrlr.postUserApp);

//checks to see if the user has right to access the app's feature
router.post('/user-app-feature', apiAppChecksCtrlr.postUserAppFeature);

//TODO: /user-app-file //checks to see if the user has right to access the app's file

module.exports = router;