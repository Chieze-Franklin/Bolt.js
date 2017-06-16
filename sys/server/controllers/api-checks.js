var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var superagent = require('superagent');

module.exports = {
	getAppsForUser: function(request, response){
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

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

							apps.forEach(function(app) {
								if (filteredAppNames.indexOf(app.name) < 0) { //consider only apps that havnt been picked in previous loops
									//if app has controlledVisibility==false (its visibility is NOT controlled), then it is visible to everyone
									if (app.controlledVisibility == false) {
										filteredApps.push(app);
										filteredAppNames.push(app.name);
										loopThroughRoles(++index);
									}
									else {
										//check if there is an app-role relationship between the app and ANY of the user's assigned roles
										models.appRoleAssoc.findOne({ app: app.name, role: userRole.role }, function(errorAppRole, appRole) {
											if (!utils.Misc.isNullOrUndefined(appRole)) {
												filteredApps.push(app);
												filteredAppNames.push(app.name);
												loopThroughRoles(++index);
											}
											else {
												loopThroughRoles(++index);
											}
										});
									}
								}
							});

							loopThroughRoles(++index);
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
	postAppRight: function(request, response){
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

		//get user
		var username;
		if (!utils.Misc.isNullOrUndefined(request.body.user)) {
			username = utils.String.trim(request.body.user.toLowerCase());
		}
		else { //TODO: (put in June 2017) I may remove this block
			//use the current user's name
			if (!utils.Misc.isNullOrUndefined(request.session.user)){
				username = request.session.user.name;
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
				var loopThroughRoles = function(index) {
					if (index >= userRoles.length) {
						response.send(utils.Misc.createResponse(false));
						return;
					}

					var userRole = userRoles[index];

					models.role.findOne({ name: userRole.role }, function(errorRole, role) {
						if (!utils.Misc.isNullOrUndefined(role)) {
							if (role.isAdmin) {
								response.send(utils.Misc.createResponse(true));
							}
							else {
								models.appRoleAssoc.findOne({ app: appnm, role: userRole.role }, function(errorAppRole, appRole) {
									if (!utils.Misc.isNullOrUndefined(appRole)) {
										var canStartApp = appRole.start || false;
										if (!canStartApp) {
											response.send(utils.Misc.createResponse(false));
											return;
										}
										var canAccessFeature = false;
										var canAccessFile = false;

										if (!utils.Misc.isNullOrUndefined(request.body.feature)) {
											//TODO: there has to be a better way to implement case-INsensitive search
											var lowercaseFeatures = [];
											appRole.features.forEach(function(feature, index){ //TODO: use .map
												lowercaseFeatures.push(feature.toLowerCase());
											});
											canAccessFeature = (lowercaseFeatures.indexOf(request.body.feature.toLowerCase()) > -1);
											if (!canAccessFeature) {
												response.send(utils.Misc.createResponse(false));
												return;
											}
										}

										if (!utils.Misc.isNullOrUndefined(request.body.file)) {
											//TODO: there has to be a better way to implement case-INsensitive search
											var lowercaseFiles = [];
											appRole.files.forEach(function(file, index){ //TODO: use .map
												lowercaseFiles.push(file.toLowerCase());
											});
											canAccessFile = (lowercaseFiles.indexOf(request.body.file.toLowerCase()) > -1);
											if (!canAccessFile) {
												response.send(utils.Misc.createResponse(false));
												return;
											}
										}
										
										response.send(utils.Misc.createResponse(true));
									}
									else {
										loopThroughRoles(++index);
									}
								});
							}
						}
						else {
							loopThroughRoles(++index);
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
