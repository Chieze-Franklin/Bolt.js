var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var uiProfilesCtrlr = require('../controllers/ui-profiles');

var router = express.Router();

//loads the profile of the specified username
router.get('/@*', checksCtrlr.forLoggedInUiUser, uiProfilesCtrlr.getUserProfile);

module.exports = router;