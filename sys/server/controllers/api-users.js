var fs = require('fs');
var path = require('path');
var superagent = require('superagent');

var config = require("../config");
var errors = require("../errors");
var models = require("../models");
var utils = require("../utils");

var __updatableProps = ["displayName", "email", "isBlocked", "phone"];

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
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

		models.user.find(searchCriteria, function (error, users) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(users)) {
				models.user.remove(searchCriteria, function (removeError) {
					if (!utils.Misc.isNullOrUndefined(removeError)) {
						response.end(utils.Misc.createResponse(null, removeError));
					}
					else {
						users.forEach(function(user){
							//delete user-roles
							models.userRoleAssoc.remove({ user: user.name }, function(userRoleRemoveError){});
							//delete app-users
							models.appUserAssoc.remove({ user: user.name }, function(appUserRemoveError){});
						});
						response.send(utils.Misc.createResponse(utils.Misc.sanitizeUsers(users)));
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
				models.user.remove(searchCriteria, function (removeError) {
					if (!utils.Misc.isNullOrUndefined(removeError)) {
						response.end(utils.Misc.createResponse(null, removeError));
					}
					else {
						//delete user-roles
						models.userRoleAssoc.remove({ user: user.name }, function(userRoleRemoveError){});
						//delete app-users
						models.appUserAssoc.remove({ user: user.name }, function(appUserRemoveError){});
						//delete dp
						if(!utils.Misc.isNullOrUndefined(user.displayPic)) {
							fs.unlink(path.resolve(user.displayPic), function(unlinkError){}); //TODO: test this
						}

						response.send(utils.Misc.createResponse(utils.Misc.sanitizeUser(user)));
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
				response.send(utils.Misc.createResponse(utils.Misc.sanitizeUsers(users)));
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	getCurrent: function(request, response){
		if (!utils.Misc.isNullOrUndefined(request.user)) {
			response.send(utils.Misc.createResponse(request.session.user));
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
				.get(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/tokens/' + encodeURIComponent(token))
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
					if (!utils.Misc.isNullOrUndefined(request.body.email)) newUser.email = request.body.email;
					if (!utils.Misc.isNullOrUndefined(request.body.phone)) newUser.phone = request.body.phone;

					var saveUser = function() {
						newUser.save(function(saveError, savedUser){
							if (!utils.Misc.isNullOrUndefined(saveError)) {
								response.end(utils.Misc.createResponse(null, saveError, 202));
							}
							else {
								response.send(utils.Misc.createResponse(utils.Misc.sanitizeUser(savedUser)));
							}
						});
					}

					var file;
					if (!utils.Misc.isNullOrUndefined(request.file)) file = request.file;
					else if (!utils.Misc.isNullOrUndefined(request.files)) {
						for(var index = 0; index < request.files.length; index++) {
							if ("dp" == request.files[index].fieldname || "displayPic" == request.files[index].fieldname) {
								file = request.files[index];
								break;
							}
						}
					}
					if (!utils.Misc.isNullOrUndefined(file)) {
						//since multer seems not to add extensions, I'm doing it manually here
						var tempPath = path.resolve(file.path),
							targetPath = path.resolve(file.path + path.extname(file.originalname));
						fs.rename(tempPath, targetPath, function(renameError){
							//I can easily use targetPath (file.path + ext) but file.path uses '\' (instead of '/') as path separator, 
							//with which Mozilla doesn't work well sometimes
							if(!utils.Misc.isNullOrUndefined(renameError)) { //if the file could not be renamed just use the original name
								newUser.displayPic = file.destination + file.filename;
							}
							else {
								newUser.displayPic = file.destination + file.filename + path.extname(file.originalname);
							}
							saveUser();
						});
					}
					else  {
						saveUser();
					}
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

		var updateObject = utils.Misc.extractModel(request.body, __updatableProps);

		models.user.update(searchCriteria,
			{ $set: updateObject }, //with mongoose there is no need for the $set but I need to make it a habit in case I'm using MongoDB directly
			{ upsert: false }, 
			function (updateError) {
			if (!utils.Misc.isNullOrUndefined(updateError)) {
				response.end(utils.Misc.createResponse(null, updateError));
			}
			else {
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
			}
		});
	},
	putUser: function(request, response){
		var usrnm = utils.String.trim(request.params.name.toLowerCase());
		var searchCriteria = { name: usrnm };

		var updateObject = utils.Misc.extractModel(request.body, __updatableProps);

		var file;
		if (!utils.Misc.isNullOrUndefined(request.file)) file = request.file;
		else if (!utils.Misc.isNullOrUndefined(request.files)) {
			for(var index = 0; index < request.files.length; index++) {
				if ("dp" == request.files[index].fieldname || "displayPic" == request.files[index].fieldname) {
					file = request.files[index];
					break;
				}
			}
		}
		if (!utils.Misc.isNullOrUndefined(file)) {
			//first delete the former dp
			models.user.findOne(searchCriteria, function(error, user){
				if(!utils.Misc.isNullOrUndefined(user) && !utils.Misc.isNullOrUndefined(user.displayPic)){
					fs.unlink(path.resolve(user.displayPic), function(unlinkError){}); //TODO: test this
				}
			});

			//since multer seems not to add extensions, I'm doing it manually here
			var tempPath = path.resolve(file.path),
				targetPath = path.resolve(file.path + path.extname(file.originalname));
			fs.rename(tempPath, targetPath, function(renameError){	
				//I can easily use targetPath (file.path + ext) but file.path uses '\' (instead of '/') as path separator, 
				//with which Mozilla doesn't work well sometimes
				if(!utils.Misc.isNullOrUndefined(renameError)) { //if the file could not be renamed just use the original name
					updateObject.displayPic = file.destination + file.filename;
				}
				else {
					updateObject.displayPic = file.destination + file.filename + path.extname(file.originalname);
				}
			});
		}

		models.user.update(searchCriteria,
			{ $set: updateObject }, //with mongoose there is no need for the $set but I need to make it a habit in case I'm using MongoDB directly
			{ upsert: false }, 
			function (updateError) {
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
						response.send(utils.Misc.createResponse(utils.Misc.sanitizeUser(user)));
					}
				});
			}
		});
	}
};
