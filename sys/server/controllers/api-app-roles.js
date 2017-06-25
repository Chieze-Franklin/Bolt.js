var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var superagent = require('superagent');

var __updatableProps = ["permissions"];

module.exports = {
	delete: function(request, response){
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

		models.appRoleAssoc.find(searchCriteria, function (error, appRoles) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(appRoles)) {
				models.appRoleAssoc.remove(searchCriteria, function (removeError) {
					if (!utils.Misc.isNullOrUndefined(removeError)) {
						response.end(utils.Misc.createResponse(null, removeError));
					}
					else {
						appRoles = utils.Misc.sanitizeAppRoles(appRoles);
						appRoles.forEach(function(appRole){
							utils.Events.fire('app-role-deleted', { body: appRole }, request.appToken, function(eventError, eventResponse){});
						});
						response.send(utils.Misc.createResponse(appRoles));
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

		models.appRoleAssoc.find(searchCriteria, function (error, appRoles) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(appRoles)) {
				response.send(utils.Misc.createResponse(utils.Misc.sanitizeAppRoles(appRoles)));
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	post: function(request, response){
		if(!utils.Misc.isNullOrUndefined(request.body.app) && !utils.Misc.isNullOrUndefined(request.body.role)) {
			var appnm = utils.String.trim(request.body.app.toLowerCase());
			var rlnm = utils.String.trim(request.body.role.toLowerCase());
			models.app.findOne({ name: appnm }, function(errorApp, app){
				if (!utils.Misc.isNullOrUndefined(errorApp)){
					response.end(utils.Misc.createResponse(null, errorApp));
				}
				else if(utils.Misc.isNullOrUndefined(app)){
					var errApp = new Error(errors['403']);
					response.end(utils.Misc.createResponse(null, errApp, 403));
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
							models.appRoleAssoc.findOne({ app: app.name, role: role.name }, function(errorAppRole, appRole){
								if (!utils.Misc.isNullOrUndefined(errorAppRole)) {
									response.end(utils.Misc.createResponse(null, errorAppRole));
								}
								else if (utils.Misc.isNullOrUndefined(appRole)) {
									var newAppRoleAssoc = new models.appRoleAssoc({ 
										role: role.name,
										role_id: role._id, 
										app: app.name,
										app_id: app._id 
									});
									newAppRoleAssoc.start = request.body.start || false;
									newAppRoleAssoc.features = request.body.features || [];
									newAppRoleAssoc.files = request.body.files || [];
									newAppRoleAssoc.save(function(saveError, savedAppRole){
										if (!utils.Misc.isNullOrUndefined(saveError)) {
											response.end(utils.Misc.createResponse(null, saveError, 322));
										}
										else {
											savedAppRole = utils.Misc.sanitizeAppRole(savedAppRole);
											utils.Events.fire('app-role-created', { body: savedAppRole }, request.appToken, function(eventError, eventResponse){});
											response.send(utils.Misc.createResponse(savedAppRole));
										}
									});
								}
								else {
									var err = new Error(errors['321']);
									response.end(utils.Misc.createResponse(null, err, 321));
								}
							});
						}
					});
				}
			});
		}
		else {
			var error = new Error(errors['320']);
			response.end(utils.Misc.createResponse(null, error, 320));
		}
	},
	put: function(request, response){
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

		var updateObject = utils.Misc.extractModel(request.body, __updatableProps);

		//this is a hack
		//I noticed that whenever I PUT an object with empty permissions array to this endpoint
		//the 'permissions' field arrives here as undefined
		//so I'm just going to add it since I know that is the only possible field they can update
		if (utils.Misc.isNullOrUndefined(updateObject.permissions)) {
			updateObject.permissions = [];
		}

		models.appRoleAssoc.update(searchCriteria,
			{ $set: updateObject }, //with mongoose there is no need for the $set but I need to make it a habit in case I'm using MongoDB directly
			{ upsert: false }, 
			function (updateError) {
			if (!utils.Misc.isNullOrUndefined(updateError)) {
				response.end(utils.Misc.createResponse(null, updateError));
			}
			else {
				models.appRoleAssoc.find(searchCriteria, function (error, appRoles) {
					if (!utils.Misc.isNullOrUndefined(error)) {
						response.end(utils.Misc.createResponse(null, error));
					}
					else if (!utils.Misc.isNullOrUndefined(appRoles)) {
						appRoles = utils.Misc.sanitizeAppRoles(appRoles);
						appRoles.forEach(function(appRole){
							utils.Events.fire('app-role-updated', { body: appRole }, request.appToken, function(eventError, eventResponse){});
						});
						response.send(utils.Misc.createResponse(appRoles));
					}
					else {
						response.send(utils.Misc.createResponse([]));
					}
				});
			}
		});
	}
};
