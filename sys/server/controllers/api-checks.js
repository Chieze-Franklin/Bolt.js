var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var superagent = require('superagent');

module.exports = {
	getAppsForUser: function(request, response){
		var searchCriteria = request.query;

		models.app.find(searchCriteria, function(error, apps){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if(!utils.Misc.isNullOrUndefined(apps)) {
				//get user name
				var username = utils.String.trim(request.params.user.toLowerCase());

				//get user-roles associated with the user
				models.userRoleAssoc.find({ user: username }, function(errorUserRole, userRoles) {
					if (!utils.Misc.isNullOrUndefined(errorUserRole)) {
						response.end(utils.Misc.createResponse(null, errorUserRole));
					}
					else if (!utils.Misc.isNullOrUndefined(userRoles)) {
						var filteredApps = [];
						var filteredAppNames = [];

						var loopThroughRoles = function(index) {
							if (index >= userRoles.length) {
								response.send(utils.Misc.createResponse(filteredApps));
								return;
							}

							var userRole = userRoles[index];

							var loopThroughApps = function(idx) {
								if (idx >= apps.length) {
									loopThroughRoles(index + 1);
									return;
								}

								var app = apps[idx];

								if (filteredAppNames.indexOf(app.name) < 0) { //consider only apps that havnt been picked in previous loops
									//if app has controlledVisibility==false (its visibility is NOT controlled), then it is visible to everyone
									if (app.controlledVisibility == false) {
										filteredApps.push(app);
										filteredAppNames.push(app.name);
										loopThroughApps(idx + 1);
									}
									else {
										//check if there is an app-role relationship between the app and ANY of the user's assigned roles
										models.appRoleAssoc.findOne({ app: app.name, role: userRole.role }, function(errorAppRole, appRole) {
											if (!utils.Misc.isNullOrUndefined(appRole)) {
												filteredApps.push(app);
												filteredAppNames.push(app.name);
												loopThroughApps(idx + 1);
											}
											else {
												loopThroughApps(idx + 1);
											}
										});
									}
								}
								else {
									loopThroughApps(idx + 1);
								}
							}

							loopThroughApps(0);
						}

						loopThroughRoles(0);
					}
					else {
						response.send(utils.Misc.createResponse([]));
					}
				});
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	postHasPermission: function(request, response){
		//get app
		var appnm;
		if (!utils.Misc.isNullOrUndefined(request.body.app)) {
			appnm = utils.String.trim(request.body.app.toLowerCase());
		}
		else {
			var error = new Error(errors['400']);
			response.end(utils.Misc.createResponse(null, error, 400));
			return;
		}

		if (utils.Misc.isNullOrUndefined(request.body.permission)) {
			var error = new Error(errors['350']);
			response.end(utils.Misc.createResponse(null, error, 350));
			return;
		}

		//get user
		var username;
		if (!utils.Misc.isNullOrUndefined(request.body.user)) {
			username = utils.String.trim(request.body.user.toLowerCase());
		}
		else { //TODO: (put in June 2017) I may remove this block
			//use the current user's name
			if (!utils.Misc.isNullOrUndefined(request.user)){
				username = request.user.name;
			}
		}

		if (utils.Misc.isNullOrUndefined(username)) { //if username is still null or undefined
			response.send(utils.Misc.createResponse(false));
			return;
		}

		//get user-roles associated with the user
		models.userRoleAssoc.find({ user: username }, function(errorUserRole, userRoles){
			if (!utils.Misc.isNullOrUndefined(errorUserRole)) {
				response.end(utils.Misc.createResponse(null, errorUserRole));
			}
			else if (!utils.Misc.isNullOrUndefined(userRoles)) {
				var foundPermission = false;
				var loopThroughRoles = function(index) {
					if (index >= userRoles.length || foundPermission) {
						response.send(utils.Misc.createResponse(foundPermission));
						return;
					}

					var userRole = userRoles[index];

					models.role.findOne({ name: userRole.role }, function(errorRole, role) {
						if (!utils.Misc.isNullOrUndefined(role)) {
							if (role.isAdmin) {
								foundPermission = true;
								loopThroughRoles(index + 1);
							}
							else {
								models.appRoleAssoc.findOne({ app: appnm, role: userRole.role }, function(errorAppRole, appRole) {
									if (!utils.Misc.isNullOrUndefined(appRole)) {
										//TODO: there has to be a better way to implement case-INsensitive search
										if (!utils.Misc.isNullOrUndefined(appRole.permissions)) {
											var lowercasePermissions = appRole.permissions.map(function(p) { return p.toLowerCase(); });
											foundPermission = (lowercasePermissions.indexOf(request.body.permission.toLowerCase()) > -1);
										}
										
										loopThroughRoles(index + 1);
									}
									else {
										loopThroughRoles(index + 1);
									}
								});
							}
						}
						else {
							loopThroughRoles(index + 1);
						}
					});
				}

				loopThroughRoles(0);

			}
			else {
				response.send(utils.Misc.createResponse(false));
			}
		});
	}
};
