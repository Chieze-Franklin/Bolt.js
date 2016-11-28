var superagent = require('superagent');

var config = require("../config");
var errors = require("../errors");
var models = require("../models");
var utils = require("../utils");

module.exports = {
	delete: function(request, response){
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

		models.userRoleAssoc.find(searchCriteria, function (error, userRoles) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(userRoles)) {
				models.userRoleAssoc.remove(searchCriteria, function (remError) {
					if (!utils.Misc.isNullOrUndefined(remError)) {
						response.end(utils.Misc.createResponse(null, remError));
					}
					else {
						response.send(utils.Misc.createResponse(userRoles));
					}
				});
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});	
	},
	get: function(request, response){
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

		models.userRoleAssoc.find(searchCriteria, function (error, userRoles) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(userRoles)) {
				response.send(utils.Misc.createResponse(userRoles));
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	post: function(request, response){
		if(!utils.Misc.isNullOrUndefined(request.body.user) && !utils.Misc.isNullOrUndefined(request.body.role)){
			var usrnm = utils.String.trim(request.body.user.toLowerCase());
			var rlnm = utils.String.trim(request.body.role.toLowerCase());
			models.user.findOne({ username: usrnm }, function(errorUser, user){
				if (!utils.Misc.isNullOrUndefined(errorUser)){
					response.end(utils.Misc.createResponse(null, errorUser));
				}
				else if(utils.Misc.isNullOrUndefined(user)){
					var errUser = new Error(errors['203']);
					response.end(utils.Misc.createResponse(null, errUser, 203));
				}
				else{
					models.role.findOne({ name: rlnm }, function(errorRole, role){
						if (!utils.Misc.isNullOrUndefined(errorRole)){
							response.end(utils.Misc.createResponse(null, errorRole));
						}
						else if(utils.Misc.isNullOrUndefined(role)){
							var errRole = new Error(errors['303']);
							response.end(utils.Misc.createResponse(null, errRole, 303));
						}
						else{
							models.userRoleAssoc.findOne({ user: user.username, role: role.name }, function(errorUserRole, userRole){
								if (!utils.Misc.isNullOrUndefined(errorUserRole)) {
									response.end(utils.Misc.createResponse(null, errorUserRole));
								}
								else if (utils.Misc.isNullOrUndefined(userRole)) {
									var newUserRoleAssoc = new models.userRoleAssoc({ 
										role: role.name,
										role_id: role._id, 
										user: user.username,
										user_id: user._id 
									});
									newUserRoleAssoc.save(function(saveError, savedUserRole){
										if (!utils.Misc.isNullOrUndefined(saveError)) {
											response.end(utils.Misc.createResponse(null, saveError, 312));
										}
										else {
											response.send(utils.Misc.createResponse(savedUserRole));
										}
									});
								}
								else {
									var err = new Error(errors['311']);
									response.end(utils.Misc.createResponse(null, err, 311));
								}
							});
						}
					});
				}
			});
		}
		else {
			var error = new Error(errors['310']);
			response.end(utils.Misc.createResponse(null, error, 310));
		}
	},
	put: function(request, response){
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

		models.userRoleAssoc.find(searchCriteria, function (error, userRoles) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(userRoles)) {
				models.userRoleAssoc.update(searchCriteria, 
					{ $set: request.body }, //with mongoose there is no need for the $set but I need to make it a habit in case I'm using MongoDB directly
					{ upsert: false },
					function (remError) {
					if (!utils.Misc.isNullOrUndefined(remError)) {
						response.end(utils.Misc.createResponse(null, remError));
					}
					else {
						response.send(utils.Misc.createResponse(userRoles));
					}
				});
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});	
	}
};
