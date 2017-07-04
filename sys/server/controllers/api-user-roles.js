var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var superagent = require('superagent');

module.exports = {
	delete: function(request, response){
		var searchCriteria = request.query;

		models.userRoleAssoc.find(searchCriteria, function (error, userRoles) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(userRoles)) {
				models.userRoleAssoc.remove(searchCriteria, function (removeError) {
					if (!utils.Misc.isNullOrUndefined(removeError)) {
						response.end(utils.Misc.createResponse(null, removeError));
					}
					else {
						userRoles = utils.Misc.sanitizeUserRoles(userRoles);
						userRoles.forEach(function(userRole){
							utils.Events.fire('user-role-deleted', { body: userRole }, request.appToken, function(eventError, eventResponse){});
						});
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
		var searchCriteria = request.query;

		models.userRoleAssoc.find(searchCriteria, function (error, userRoles) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(userRoles)) {
				response.send(utils.Misc.createResponse(utils.Misc.sanitizeUserRoles(userRoles)));
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
			models.user.findOne({ name: usrnm }, function(errorUser, user){
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
							models.userRoleAssoc.findOne({ user: user.name, role: role.name }, function(errorUserRole, userRole){
								if (!utils.Misc.isNullOrUndefined(errorUserRole)) {
									response.end(utils.Misc.createResponse(null, errorUserRole));
								}
								else if (utils.Misc.isNullOrUndefined(userRole)) {
									var newUserRoleAssoc = new models.userRoleAssoc({ 
										role: role.name,
										role_id: role._id, 
										user: user.name,
										user_id: user._id 
									});
									newUserRoleAssoc.save(function(saveError, savedUserRole){
										if (!utils.Misc.isNullOrUndefined(saveError)) {
											response.end(utils.Misc.createResponse(null, saveError, 312));
										}
										else {
											savedUserRole = utils.Misc.sanitizeUserRole(savedUserRole);
											utils.Events.fire('user-role-created', { body: savedUserRole }, request.appToken, function(eventError, eventResponse){});
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
	}
};
