var checksCtrlr = require("bolt-internal-checks");

var express = require('express');

var uiFilesCtrlr = require('../controllers/ui-files');

var router = express.Router();

//TODO: GET /:file //runs a file that can be served by any app

//loads the file with the specified name (using default options)
router.get('/:app/:file', uiFilesCtrlr.getAppFile);

module.exports = router;