var config = require("bolt-internal-config");
var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var superagent = require('superagent');

var __updatableProps = ["description", "displayName", "isAdmin"];

module.exports = {
	delete: function(request, response){
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

		models.role.find(searchCriteria, function (error, roles) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(roles)) {
				models.role.remove(searchCriteria, function (removeError) {
					if (!utils.Misc.isNullOrUndefined(removeError)) {
						response.end(utils.Misc.createResponse(null, removeError));
					}
					else {
						roles.forEach(function(role){
							//delete user-roles
							models.userRoleAssoc.remove({ role: role.name }, function(userRoleRemoveError){});
							//delete app-roles
							models.appRoleAssoc.remove({ role: role.name }, function(appRoleRemoveError){});
						});
						response.send(utils.Misc.createResponse(utils.Misc.sanitizeRoles(roles)));
					}
				});
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	deleteRole: function(request, response){
		var rlnm = utils.String.trim(request.params.name.toLowerCase());
		var searchCriteria = { name: rlnm };
		models.role.findOne(searchCriteria, function(error, role){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if(utils.Misc.isNullOrUndefined(role)){
				var err = new Error(errors['303']);
				response.end(utils.Misc.createResponse(null, err, 303));
			}
			else{
				models.role.remove(searchCriteria, function (removeError) {
					if (!utils.Misc.isNullOrUndefined(removeError)) {
						response.end(utils.Misc.createResponse(null, removeError));
					}
					else {
						//delete user-roles
						models.userRoleAssoc.remove({ role: role.name }, function(userRoleRemoveError){});
						//delete app-roles
						models.appRoleAssoc.remove({ role: role.name }, function(appRoleRemoveError){});

						response.send(utils.Misc.createResponse(utils.Misc.sanitizeRole(role)));
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

		models.role.find(searchCriteria, function (error, roles) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(roles)) {
				response.send(utils.Misc.createResponse(utils.Misc.sanitizeRoles(roles)));
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	getRole: function(request, response){
		var rlnm = utils.String.trim(request.params.name.toLowerCase());
		models.role.findOne({ 
			name: rlnm
		}, function(error, role){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if(utils.Misc.isNullOrUndefined(role)){
				var err = new Error(errors['303']);
				response.end(utils.Misc.createResponse(null, err, 303));
			}
			else{
				response.send(utils.Misc.createResponse(utils.Misc.sanitizeRole(role)));
			}
		});
	},
	post: function(request, response){
		if(!utils.Misc.isNullOrUndefined(request.body.name)){
			var rlnm = utils.String.trim(request.body.name.toLowerCase());
			models.role.findOne({ name: rlnm }, function(error, role){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else if(utils.Misc.isNullOrUndefined(role)){
					var newRole = new models.role({ name: rlnm });
					if(!utils.Misc.isNullOrUndefined(request.body.isAdmin)){
						newRole.isAdmin = request.body.isAdmin;
					}
					if(!utils.Misc.isNullOrUndefined(request.body.description)){
						newRole.description = request.body.description;
					}
					newRole.displayName = request.body.displayName || request.body.name;
					newRole.save(function(saveError, savedRole){
						if (!utils.Misc.isNullOrUndefined(saveError)) {
							response.end(utils.Misc.createResponse(null, saveError, 302));
						}
						else {
							response.send(utils.Misc.createResponse(utils.Misc.sanitizeRole(savedRole)));
						}
					});
				}
				else{
					var err = new Error(errors['301']);
					response.end(utils.Misc.createResponse(null, err, 301));
				}
			});
		}
		else {
			var error = new Error(errors['300']);
			response.end(utils.Misc.createResponse(null, error, 300));
		}
	},
	put: function(request, response){
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

		var updateObject = utils.Misc.extractModel(request.body, __updatableProps);

		models.role.update(searchCriteria,
			{ $set: updateObject }, //with mongoose there is no need for the $set but I need to make it a habit in case I'm using MongoDB directly
			{ upsert: false }, 
			function (updateError) {
			if (!utils.Misc.isNullOrUndefined(updateError)) {
				response.end(utils.Misc.createResponse(null, updateError));
			}
			else {
				models.role.find(searchCriteria, function (error, roles) {
					if (!utils.Misc.isNullOrUndefined(error)) {
						response.end(utils.Misc.createResponse(null, error));
					}
					else if (!utils.Misc.isNullOrUndefined(roles)) {
						response.send(utils.Misc.createResponse(utils.Misc.sanitizeRoles(roles)));
					}
					else {
						response.send(utils.Misc.createResponse([]));
					}
				});
			}
		});
	},
	putRole: function(request, response){
		var usrnm = utils.String.trim(request.params.name.toLowerCase());
		var searchCriteria = { name: usrnm };

		var updateObject = utils.Misc.extractModel(request.body, __updatableProps);

		models.role.update(searchCriteria,
			{ $set: updateObject }, //with mongoose there is no need for the $set but I need to make it a habit in case I'm using MongoDB directly
			{ upsert: false }, 
			function (updateError) {
			if (!utils.Misc.isNullOrUndefined(updateError)) {
				response.end(utils.Misc.createResponse(null, updateError));
			}
			else {
				models.role.findOne(searchCriteria, function(error, role){
					if (!utils.Misc.isNullOrUndefined(error)) {
						response.end(utils.Misc.createResponse(null, error));
					}
					else if(utils.Misc.isNullOrUndefined(role)){
						var err = new Error(errors['303']);
						response.end(utils.Misc.createResponse(null, err, 303));
					}
					else{
						response.send(utils.Misc.createResponse(utils.Misc.sanitizeRole(role)));
					}
				});
			}
		});
	}
};
