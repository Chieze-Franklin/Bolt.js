var express = require('express');

var checksCtrlr = require('../controllers/checks');
var uiFilesCtrlr = require('../controllers/ui-files');

var router = express.Router();

//TODO: GET /:file //runs a file that can be served by any app

//loads the file with the specified name (using default options)
//ISSUE: does not work properly because browsers seem to block it
router.get('/:app/:file', checksCtrlr.forAppFileRight, uiFilesCtrlr.getAppFile);

module.exports = router;