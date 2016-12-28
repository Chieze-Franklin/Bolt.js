var express = require('express');

var checksCtrlr = require('../controllers/checks');
var apiDbCtrlr = require('../controllers/api-db');

var router = express.Router();

//drops
router.post('/:collection/drop', checksCtrlr.forDbAccess, checksCtrlr.getDbName, apiDbCtrlr.postDrop);

//finds all
router.post('/:collection/find', checksCtrlr.forDbAccess, checksCtrlr.getDbName, apiDbCtrlr.postFind);

//finds one
router.post('/:collection/findone', checksCtrlr.forDbAccess, checksCtrlr.getDbName, apiDbCtrlr.postFindOne);

//inserts
router.post('/:collection/insert', checksCtrlr.forDbOwner, checksCtrlr.getDbName, apiDbCtrlr.postInsert);

//removes
router.post('/:collection/remove', checksCtrlr.forDbOwner, checksCtrlr.getDbName, apiDbCtrlr.postRemove);

//replaces
router.post('/:collection/replace', checksCtrlr.forDbOwner, checksCtrlr.getDbName, apiDbCtrlr.postReplace);

//updates
router.post('/:collection/update', checksCtrlr.forDbOwner, checksCtrlr.getDbName, apiDbCtrlr.postUpdate);

module.exports = router;