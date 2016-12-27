var express = require('express');

var checksCtrlr = require('../controllers/checks');
var apiDbCtrlr = require('../controllers/api-db');

var router = express.Router();

//drops
router.post('/drop', checksCtrlr.forDbAccess, checksCtrlr.getDbName, apiDbCtrlr.postDrop);

//finds all
router.post('/find', checksCtrlr.forDbAccess, checksCtrlr.getDbName, apiDbCtrlr.postFind);

//finds one
router.post('/findone', checksCtrlr.forDbAccess, checksCtrlr.getDbName, apiDbCtrlr.postFindOne);

//inserts
router.post('/insert', checksCtrlr.forDbOwner, checksCtrlr.getDbName, apiDbCtrlr.postInsert);

//removes
router.post('/remove', checksCtrlr.forDbOwner, checksCtrlr.getDbName, apiDbCtrlr.postRemove);

//replaces
router.post('/replace', checksCtrlr.forDbOwner, checksCtrlr.getDbName, apiDbCtrlr.postReplace);

//updates
router.post('/update', checksCtrlr.forDbOwner, checksCtrlr.getDbName, apiDbCtrlr.postUpdate);

module.exports = router;