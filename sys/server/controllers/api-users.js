var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var fs = require('fs');
var path = require('path');
var superagent = require('superagent');

const X_BOLT_APP_TOKEN = 'X-Bolt-App-Token';

var __updatableProps = ["displayName", "dn", "displayPic", "dp", "email", "isBlocked", "phone"];

var __users = [];
//considering users can log in and out on different devices and browsers, this maps a user to the number of current log-ins
//when the number gets to zero we remove the user from this map
var __usernamesToLoginsMap = new Map();
//note when a user logs in
var __registerLogin = function(user) {
	var username = user.name;
	if (__usernamesToLoginsMap.has(username)) {
		var logins = __usernamesToLoginsMap.get(username);
		__usernamesToLoginsMap.delete(username); //just to be sure none exists before we run __usernamesToLoginsMap.set(...); below
		__usernamesToLoginsMap.set(username, ++logins);
	}
	else {
		__usernamesToLoginsMap.set(username, 1);
		__users.push(user);
	}
}
//note when a user logs out
var __registerLogout = function(user) {
	var username = user.name;
	if (__usernamesToLoginsMap.has(username)) {
		var logins = __usernamesToLoginsMap.get(username);
		__usernamesToLoginsMap.delete(username); //just to be sure none exists before we run __usernamesToLoginsMap.set(...); below
		__users.pop(user);
		if(logins > 1) {
			__usernamesToLoginsMap.set(username, --logins);
			__users.push(user);
		}
	}
}

const X_BOLT_USER_TOKEN = 'X-Bolt-User-Token';
const X_BOLT_USER_NAME = 'X-Bolt-User-Name';

module.exports = {
	delete: function(request, response){
		var searchCriteria = request.query;

		models.user.find(searchCriteria, function (error, users) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(users)) {
				models.user.remove(searchCriteria, function (removeError, removeResult) {
					if (!utils.Misc.isNullOrUndefined(removeError)) {
						response.end(utils.Misc.createResponse(null, removeError));
					}
					else {
						users = utils.Misc.sanitizeUsers(users);
						users.forEach(function(user){
							//delete dp
							if(!utils.Misc.isNullOrUndefined(user.displayPic)) {
								fs.unlink(path.resolve(user.displayPic), function(unlinkError){});
							}

							utils.Events.fire('user-deleted', { body: user }, request.bolt.token, function(eventError, eventResponse){});
						});
						response.send(utils.Misc.createResponse(users));
					}
				});
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	deleteUser: function(request, response){
		var usrnm = utils.String.trim(request.params.name.toLowerCase());
		var searchCriteria = { name: usrnm };
		models.user.findOne(searchCriteria, function(error, user){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if(utils.Misc.isNullOrUndefined(user)){
				var err = new Error(errors['203']);
				response.end(utils.Misc.createResponse(null, err, 203));
			}
			else{
				models.user.remove(searchCriteria, function (removeError, removeResult) {
					if (!utils.Misc.isNullOrUndefined(removeError)) {
						response.end(utils.Misc.createResponse(null, removeError));
					}
					else {
						//delete dp
						if(!utils.Misc.isNullOrUndefined(user.displayPic)) {
							fs.unlink(path.resolve(user.displayPic), function(unlinkError){});
						}

						user = utils.Misc.sanitizeUser(user);
						utils.Events.fire('user-deleted', { body: user }, request.bolt.token, function(eventError, eventResponse){});
						response.send(utils.Misc.createResponse(user));
					}
				});
			}
		});
	},
	get: function(request, response){
		var searchCriteria = request.query;

		models.user.find(searchCriteria, function (error, users) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(users)) {
				response.send(utils.Misc.createResponse(utils.Misc.sanitizeUsers(users)));
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	getCurrent: function(request, response){
		if (!utils.Misc.isNullOrUndefined(request.user)) {
			response.send(utils.Misc.createResponse(request.user));
		}
		else if (!utils.Misc.isNullOrUndefined(request.get(X_BOLT_USER_NAME))) {
			var username = request.get(X_BOLT_USER_NAME);

			models.user.findOne({ 
				name: username
			}, function(error, user){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else if(utils.Misc.isNullOrUndefined(user)){
					var err = new Error(errors['203']);
					response.end(utils.Misc.createResponse(null, err, 203));
				}
				else{
					response.send(utils.Misc.createResponse(utils.Misc.sanitizeUser(user)));
				}
			});
		}
		else if (!utils.Misc.isNullOrUndefined(request.get(X_BOLT_USER_TOKEN))) {
			var token = request.get(X_BOLT_USER_TOKEN);
			
			superagent
				.get(process.env.BOLT_ADDRESS + '/api/tokens/' + encodeURIComponent(token))
				.end(function(tokenError, tokenResponse){
					if (!utils.Misc.isNullOrUndefined(tokenError)) {
						response.end(utils.Misc.createResponse(null, tokenError));
						return;
					}

					var realResponse = tokenResponse.body;
					if (!utils.Misc.isNullOrUndefined(realResponse.error)) {
						response.end(utils.Misc.createResponse(null, realResponse.error, realResponse.code, 
							realResponse.errorTraceId, realResponse.errorUserTitle, realResponse.errorUserMessage));
						return;
					}
					
					var userid = realResponse.body;
					models.user.findOne({ 
						_id: userid
					}, function(error, user){
						if (!utils.Misc.isNullOrUndefined(error)) {
							response.end(utils.Misc.createResponse(null, error));
						}
						else if(utils.Misc.isNullOrUndefined(user)){
							var err = new Error(errors['203']);
							response.end(utils.Misc.createResponse(null, err, 203));
						}
						else{
							response.send(utils.Misc.createResponse(utils.Misc.sanitizeUser(user)));
						}
					});
				});
		}
		else {
			var error = new Error(errors['213']);
			response.end(utils.Misc.createResponse(null, error, 213));
		}
	},
	getLive: function(request, response){
		response.send(utils.Misc.createResponse(__users));
	},
	getUser: function(request, response){
		var usrnm = utils.String.trim(request.params.name.toLowerCase());
		models.user.findOne({ 
			name: usrnm
		}, function(error, user){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if(utils.Misc.isNullOrUndefined(user)){
				var err = new Error(errors['203']);
				response.end(utils.Misc.createResponse(null, err, 203));
			}
			else{
				response.send(utils.Misc.createResponse(utils.Misc.sanitizeUser(user)));
			}
		});
	},
	post: function(request, response){
		if(!utils.Misc.isNullOrUndefined(request.body.name) && !utils.Misc.isNullOrUndefined(request.body.password)){
			var usrnm = utils.String.trim(request.body.name.toLowerCase());
			models.user.findOne({ name: usrnm }, function(error, user){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else if (utils.Misc.isNullOrUndefined(user)) {
					var newUser = new models.user({ 
						name: usrnm, 
						passwordHash: utils.Security.hashSync(request.body.password + usrnm)
					});

					newUser.displayName = request.body.displayName || request.body.dn || request.body.name;
					newUser.displayPic = request.body.displayPic || request.body.dp;
					if (!utils.Misc.isNullOrUndefined(request.body.email)) newUser.email = request.body.email;
					if (!utils.Misc.isNullOrUndefined(request.body.phone)) newUser.phone = request.body.phone;

					newUser.save(function(saveError, savedUser){
						if (!utils.Misc.isNullOrUndefined(saveError)) {
							response.end(utils.Misc.createResponse(null, saveError, 202));
						}
						else {
							savedUser = utils.Misc.sanitizeUser(savedUser);
							utils.Events.fire('user-created', { body: savedUser }, request.bolt.token, function(eventError, eventResponse){});
							response.send(utils.Misc.createResponse(savedUser));
						}
					});
				}
				else {
					var err = new Error(errors['201']);
					response.end(utils.Misc.createResponse(null, err, 201));
				}
			});
		}
		else {
			var error = new Error(errors['200']);
			response.end(utils.Misc.createResponse(null, error, 200));
		}
	},
	postChangePassword: function(request, response){
		if(request.user && request.body.password && request.body.newPassword){
			var usrnm = utils.String.trim(request.user.name.toLowerCase());
			models.user.findOne({ 
				name: usrnm, 
				passwordHash: utils.Security.hashSync(request.body.password + usrnm) 
			}, function(error, user){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else if(utils.Misc.isNullOrUndefined(user)){
					request.session.reset();
					var err = new Error(errors['203']);
					response.end(utils.Misc.createResponse(null, err, 203));
				}
				else{
					user.passwordHash = utils.Security.hashSync(request.body.newPassword + usrnm);
					user.save(function(saveError, savedUser){});
					user = utils.Misc.sanitizeUser(user);
					response.send(utils.Misc.createResponse(user));
				}
			});
		}
		else {
			var error = new Error(errors['200']);
			response.end(utils.Misc.createResponse(null, error, 200));
		}
	},
	postLogin: function(request, response){
		if(!utils.Misc.isNullOrUndefined(request.body.name) && !utils.Misc.isNullOrUndefined(request.body.password)){
			var usrnm = utils.String.trim(request.body.name.toLowerCase());
			models.user.findOne({ 
				name: usrnm, 
				passwordHash: utils.Security.hashSync(request.body.password + usrnm) 
			}, function(error, user){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else if(utils.Misc.isNullOrUndefined(user)){
					request.session.reset();
					var err = new Error(errors['203']);
					response.end(utils.Misc.createResponse(null, err, 203));
				}
				else{
					if (user.isBlocked) { //TODO: test this
						request.session.reset();

						var userBlockedError = new Error(errors['212']);
						response.end(utils.Misc.createResponse(null, userBlockedError, 212));
					}
					else {
						user.visits+=1;
						user.lastVisit = new Date();
						user.save(function(saveError, savedUser){});
						request.user = utils.Misc.sanitizeUser(user);
						request.session.user = request.user;
						response.locals.user = request.user; //make available to UI template engines

						__registerLogin(request.user);
						//fire the 'user-logged-in' (change to user_logged_in?) event
						utils.Events.fire('user-logged-in', { body: request.user }, request.bolt.token, function(eventError, eventResponse){});
						response.send(utils.Misc.createResponse(request.user));
					}
				}
			});
		}
		else {
			var error = new Error(errors['200']);
			response.end(utils.Misc.createResponse(null, error, 200));
		}
	},
	postLogout: function(request, response){
		var user = request.session.user;
		if(!utils.Misc.isNullOrUndefined(user)) {
			__registerLogout(user);
			utils.Events.fire('user-logged-out', { body: user }, request.bolt.token, function(eventError, eventResponse){});
		}
		request.session.reset();
	  	response.end(utils.Misc.createResponse(user, null, 0));
	},
	postResetPassword: function(request, response){
		if(request.body.name && request.body.password){
			var usrnm = utils.String.trim(request.body.name.toLowerCase());
			models.user.findOne({ 
				name: usrnm
			}, function(error, user){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else if(utils.Misc.isNullOrUndefined(user)){
					request.session.reset();
					var err = new Error(errors['203']);
					response.end(utils.Misc.createResponse(null, err, 203));
				}
				else{
					user.passwordHash = utils.Security.hashSync(request.body.password + usrnm);
					user.save(function(saveError, savedUser){});
					user = utils.Misc.sanitizeUser(user);
					response.send(utils.Misc.createResponse(user));
				}
			});
		}
		else {
			var error = new Error(errors['200']);
			response.end(utils.Misc.createResponse(null, error, 200));
		}
	},
	put: function(request, response){
		var searchCriteria = request.query;

		var updateObject = utils.Misc.extractModel(request.body, __updatableProps);

		if (utils.Misc.isNullOrUndefined(updateObject.displayName) && !utils.Misc.isNullOrUndefined(updateObject.dn))
			updateObject.displayName = updateObject.dn;
		if (utils.Misc.isNullOrUndefined(updateObject.displayPic) && !utils.Misc.isNullOrUndefined(updateObject.dp))
			updateObject.displayPic = updateObject.dp;

		function updateUsers() {
			models.user.update(searchCriteria,
				{ $set: updateObject }, //with mongoose there is no need for the $set but I need to make it a habit in case I'm using MongoDB directly
				{ upsert: false }, 
				function (updateError, updateDoc) {
				if (!utils.Misc.isNullOrUndefined(updateError)) {
					response.end(utils.Misc.createResponse(null, updateError));
				}
				else {
					models.user.find(searchCriteria, function (error, users) {
						if (!utils.Misc.isNullOrUndefined(error)) {
							response.end(utils.Misc.createResponse(null, error));
						}
						else if (!utils.Misc.isNullOrUndefined(users)) {
							users = utils.Misc.sanitizeUsers(users);
							users.forEach(function(user){
								utils.Events.fire('user-updated', { body: user }, request.bolt.token, function(eventError, eventResponse){});
							});
							response.send(utils.Misc.createResponse(users));
						}
						else {
							response.send(utils.Misc.createResponse([]));
						}
					});
				}
			});
		}

		if (!utils.Misc.isNullOrUndefined(updateObject.displayPic)) {
			//delete the former dp
			models.user.find(searchCriteria, function(error, users){
				if (!utils.Misc.isNullOrUndefined(users)) {
					users.forEach(function(user){
						if(!utils.Misc.isNullOrUndefined(user) && !utils.Misc.isNullOrUndefined(user.displayPic)
							&& user.displayPic != updateObject.displayPic){
							var prevPic = user.displayPic;
							var indexOfLastSlash = prevPic.lastIndexOf('/');
							var filename = prevPic.substring(indexOfLastSlash + 1);
							superagent
								.delete(process.env.BOLT_ADDRESS + '/public/upload/' + filename)
								.end(function(deleteError, deleteResponse){});
						}
					});

					updateUsers();
				}
				else {
					updateUsers();
				}
			});
		}
		else {
			updateUsers();
		}
	},
	putUser: function(request, response){
		var usrnm = utils.String.trim(request.params.name.toLowerCase());
		var searchCriteria = { name: usrnm };

		var updateObject = request.body;
		updateObject = utils.Misc.extractModel(updateObject, __updatableProps);

		if (utils.Misc.isNullOrUndefined(updateObject.displayName) && !utils.Misc.isNullOrUndefined(updateObject.dn))
			updateObject.displayName = updateObject.dn;
		if (utils.Misc.isNullOrUndefined(updateObject.displayPic) && !utils.Misc.isNullOrUndefined(updateObject.dp))
			updateObject.displayPic = updateObject.dp;

		function updateUser() {
			models.user.update(searchCriteria,
				{ $set: updateObject }, //with mongoose there is no need for the $set but I need to make it a habit in case I'm using MongoDB directly
				{ upsert: false }, 
				function (updateError, updateDoc) {
				if (!utils.Misc.isNullOrUndefined(updateError)) {
					response.end(utils.Misc.createResponse(null, updateError));
				}
				else {
					models.user.findOne(searchCriteria, function(error, user){
						if (!utils.Misc.isNullOrUndefined(error)) {
							response.end(utils.Misc.createResponse(null, error));
						}
						else if(utils.Misc.isNullOrUndefined(user)){
							var err = new Error(errors['203']);
							response.end(utils.Misc.createResponse(null, err, 203));
						}
						else{
							user = utils.Misc.sanitizeUser(user);
							utils.Events.fire('user-updated', { body: user }, request.bolt.token, function(eventError, eventResponse){});
							response.send(utils.Misc.createResponse(user));
						}
					});
				}
			});
		}

		if (!utils.Misc.isNullOrUndefined(updateObject.displayPic)) {
			//delete the former dp
			models.user.findOne(searchCriteria, function(error, user){
				if(!utils.Misc.isNullOrUndefined(user) && !utils.Misc.isNullOrUndefined(user.displayPic) 
					&& user.displayPic != updateObject.displayPic){
					var prevPic = user.displayPic;
					var indexOfLastSlash = prevPic.lastIndexOf('/');
					var filename = prevPic.substring(indexOfLastSlash + 1);
					superagent
						.delete(process.env.BOLT_ADDRESS + '/public/upload/' + filename)
						.end(function(deleteError, deleteResponse){});

					updateUser();
				}
				else {
					updateUser();
				}
			});
		}
		else {
			updateUser();
		}
	}
};
