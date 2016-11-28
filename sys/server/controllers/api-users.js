var superagent = require('superagent');

var config = require("../config");
var errors = require("../errors");
var models = require("../models");
var utils = require("../utils");

var __users = [];
//considering users can log in and out on different devices and browsers, this maps a user to the number of current log-ins
//when the number gets to zero we remove the user from this map
var __usernamesToLoginsMap = new Map();
//note when a user logs in
var __registerLogin = function(user) {
	var username = user.username;
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
	var username = user.username;
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

module.exports = {
	delete: function(request, response){
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

		models.user.find(searchCriteria, function (error, users) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(users)) {
				models.user.remove(searchCriteria, function (remError) {
					if (!utils.Misc.isNullOrUndefined(remError)) {
						response.end(utils.Misc.createResponse(null, remError));
					}
					else {
						users.forEach(function(user){
							//delete user-roles
							models.userRoleAssoc.remove({ user: user.username }, function(userRoleRemError){});
							//TODO: delete app-user
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
		var usrnm = utils.String.trim(request.params.user.toLowerCase());
		var searchCriteria = { username: usrnm };
		models.user.findOne(searchCriteria, function(error, user){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if(utils.Misc.isNullOrUndefined(user)){
				var err = new Error(errors['203']);
				response.end(utils.Misc.createResponse(null, err, 203));
			}
			else{
				models.user.remove(searchCriteria, function (remError) {
					if (!utils.Misc.isNullOrUndefined(remError)) {
						response.end(utils.Misc.createResponse(null, remError));
					}
					else {
						//delete user-roles
						models.userRoleAssoc.remove({ user: user.username }, function(userRoleRemError){});
						//TODO: delete app-user
						response.send(utils.Misc.createResponse(user));
					}
				});
			}
		});
	},
	get: function(request, response){
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

		models.user.find(searchCriteria, function (error, users) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(users)) {
				response.send(utils.Misc.createResponse(users));
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	getCurrent: function(request, response){
		if (!utils.Misc.isNullOrUndefined(request.session.user)) {
			response.send(utils.Misc.createResponse(request.session.user));
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
		var usrnm = utils.String.trim(request.params.user.toLowerCase());
		models.user.findOne({ 
			username: usrnm
		}, function(error, user){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if(utils.Misc.isNullOrUndefined(user)){
				var err = new Error(errors['203']);
				response.end(utils.Misc.createResponse(null, err, 203));
			}
			else{
				response.send(utils.Misc.createResponse(user));
			}
		});
	},
	post: function(request, response){
		if(!utils.Misc.isNullOrUndefined(request.body.username) && !utils.Misc.isNullOrUndefined(request.body.password)){
			var usrnm = utils.String.trim(request.body.username.toLowerCase());
			models.user.findOne({ username: usrnm }, function(error, user){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else if (utils.Misc.isNullOrUndefined(user)) {
					var newUser = new models.user({ 
						username: usrnm, 
						passwordHash: utils.Security.hashSync(request.body.password + usrnm)
					});
					newUser.save(function(saveError, savedUser){
						if (!utils.Misc.isNullOrUndefined(saveError)) {
							response.end(utils.Misc.createResponse(null, saveError, 202));
						}
						else {
							delete savedUser.passwordHash; //TODO: not working
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
	postLogin: function(request, response){
		if(!utils.Misc.isNullOrUndefined(request.body.username) && !utils.Misc.isNullOrUndefined(request.body.password)){
			var usrnm = utils.String.trim(request.body.username.toLowerCase());
			models.user.findOne({ 
				username: usrnm, 
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
					}
					else {
						user.visits+=1;
						user.save(function(saveError, savedUser){});
						delete user.passwordHash; //TODO: not working
						request.user = user;
						request.session.user = user;
						response.locals.user = user; //make available to UI template engines
					}
					__registerLogin(user);
					response.send(utils.Misc.createResponse(user));
				}
			});
		}
		else {
			var error = new Error(errors['200']);
			response.end(utils.Misc.createResponse(null, error, 200));
		}
	},
	postLogout: function(request, response){
		if(!utils.Misc.isNullOrUndefined(request.session.user)) {
			__registerLogout(request.session.user);
		}
		request.session.reset();
	  	response.end(utils.Misc.createResponse(request.session.user, null, 0));
	},
	put: function(request, response){
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

		models.user.find(searchCriteria, function (error, users) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(users)) {
				models.user.update(searchCriteria,
					{ $set: request.body }, //with mongoose there is no need for the $set but I need to make it a habit in case I'm using MongoDB directly
					{ upsert: false }, 
					function (putError) {
					if (!utils.Misc.isNullOrUndefined(putError)) {
						response.end(utils.Misc.createResponse(null, putError));
					}
					else {
						response.send(utils.Misc.createResponse(users));
					}
				});
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	putUser: function(request, response){
		var usrnm = utils.String.trim(request.params.user.toLowerCase());
		var searchCriteria = { username: usrnm };
		models.user.findOne(searchCriteria, function(error, user){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if(utils.Misc.isNullOrUndefined(user)){
				var err = new Error(errors['203']);
				response.end(utils.Misc.createResponse(null, err, 203));
			}
			else{
				models.user.update(searchCriteria,
					{ $set: request.body }, //with mongoose there is no need for the $set but I need to make it a habit in case I'm using MongoDB directly
					{ upsert: false }, 
					function (putError) {
					if (!utils.Misc.isNullOrUndefined(putError)) {
						response.end(utils.Misc.createResponse(null, putError));
					}
					else {
						response.send(utils.Misc.createResponse(user));
					}
				});
			}
		});
	}
};
