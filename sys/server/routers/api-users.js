var express = require('express');

var checksCtrlr = require('../controllers/checks');
var apiUsersCtrlr = require('../controllers/api-users');

var router = express.Router();

//TODO: DEL: / //usage: ?username=frank

//returns an array of user objects matching the specified criteria
router.get('/', apiUsersCtrlr.get);

//gets the logged-in user for the current session
//ISSUE: hard to get right considering that we use cookies, and the cookies reside on the browsers (clients) not the server
//and this isn't necessarily a website that is "always on"
//TODO: look for a better Node.js authentication process
router.get('/@current', apiUsersCtrlr.getCurrent);

//returns an array of all live (currently-logged-in) users
//ISSUE: hard to get right considering that we use cookies, and the cookies reside on the browsers (clients) not the server
//and this isn't necessarily a website that is "always on"
//TODO: look for a better Node.js authentication process
router.get('/@live', apiUsersCtrlr.getLive);

//gets the user object of the user with the specified name
router.get('/:name', apiUsersCtrlr.getUser);

//adds a user to the database
router.post('/', checksCtrlr.forSystemApp, apiUsersCtrlr.post);

//logs a user into the system
router.post('/login', checksCtrlr.forSystemApp, apiUsersCtrlr.postLogin);

//logs a user out of the system
router.post('/logout', checksCtrlr.forSystemApp, apiUsersCtrlr.postLogout);

//deletes an array of user objects matching the specified criteria
router.delete('/', checksCtrlr.forSystemApp, apiUsersCtrlr.delete);

//deletes a user from the database
router.delete('/:name', checksCtrlr.forSystemApp, apiUsersCtrlr.deleteUser);

//updates an array of user objects matching the specified criteria
router.put('/', checksCtrlr.forSystemApp, apiUsersCtrlr.put);

//updates a user in the database
router.put('/:name', checksCtrlr.forSystemApp, apiUsersCtrlr.putUser);

module.exports = router;