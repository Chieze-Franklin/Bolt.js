var express = require('express');

var checksCtrlr = require('../controllers/checks');
var apiUsersCtrlr = require('../controllers/api-users');

var router = express.Router();

//TODO: DEL: / //usage: ?username=frank

//returns an array of user objects matching the specified criteria
router.get('/', apiUsersCtrlr.get);

//adds a user to the database
router.post('/', checksCtrlr.forSystemApp, apiUsersCtrlr.post);

//logs a user into the system
router.post('/login', checksCtrlr.forSystemApp, apiUsersCtrlr.postLogin);

//logs a user out of the system
router.post('/logout', checksCtrlr.forSystemApp, apiUsersCtrlr.postLogout);

//TODO: GET: /@current //gets the current user

//TODO: GET: /@live //returns an array of all live (currently-logged-in) users

module.exports = router;