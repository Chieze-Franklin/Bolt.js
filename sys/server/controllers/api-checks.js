var superagent = require('superagent');

var config = require("../config");
var models = require("../models");
var utils = require("../utils");

module.exports = {
	postUserApp: function(request, response){
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
		else {
			//use the current user's name
			if (!utils.Misc.isNullOrUndefined(request.session.user)){
				username = request.session.user.username;
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

					//get app-roles associated with roles in user-roles and app
					var userRole = userRoles[index];
					models.appRoleAssoc.findOne({ app: appnm, role: userRole.role }, function(errorAppRole, appRole) {
						if (!utils.Misc.isNullOrUndefined(errorAppRole)) {
							response.end(utils.Misc.createResponse(null, errorAppRole));
						}
						else if (!utils.Misc.isNullOrUndefined(appRole)) {
							var canStartApp = false;
							var canAccessFeature = false;

							if (!utils.Misc.isNullOrUndefined(appRole.start)) {
								canStartApp = appRole.start;
							}

							if (!utils.Misc.isNullOrUndefined(request.body.feature)) {
								//TODO: there has to be a better way to implment case-INsensitive search
								var lowercaseFeatures = [];
								appRole.features.forEach(function(feature, index){
									lowercaseFeatures.push(feature.toLowerCase());
								});
								canAccessFeature = (lowercaseFeatures.indexOf(request.body.feature.toLowerCase()) > -1);
							}
							else { //if the request doesn't specify the feature to check, then just set canAccessFeature = true
								canAccessFeature = true;
							}
							
							response.send(utils.Misc.createResponse(canStartApp && canAccessFeature));
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
	},
	postUserAppFeature: function(request, response){
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
		else {
			//use the current user's name
			if (!utils.Misc.isNullOrUndefined(request.session.user)){
				username = request.session.user.username;
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

					//get app-roles associated with roles in user-roles and app
					var userRole = userRoles[index];
					models.appRoleAssoc.findOne({ app: appnm, role: userRole.role }, function(errorAppRole, appRole) {
						if (!utils.Misc.isNullOrUndefined(errorAppRole)) {
							response.end(utils.Misc.createResponse(null, errorAppRole));
						}
						else if (!utils.Misc.isNullOrUndefined(appRole)) {
							var canStartApp = false;
							var canAccessFeature = false;

							if (!utils.Misc.isNullOrUndefined(appRole.start)) {
								canStartApp = appRole.start;
							}

							if (!utils.Misc.isNullOrUndefined(request.body.feature)) {
								//TODO: there has to be a better way to implment case-INsensitive search
								var lowercaseFeatures = [];
								appRole.features.forEach(function(feature, index){
									lowercaseFeatures.push(feature.toLowerCase());
								});
								canAccessFeature = (lowercaseFeatures.indexOf(request.body.feature.toLowerCase()) > -1);
							}
							else { //if the request doesn't specify the feature to check, then just set canAccessFeature = true
								canAccessFeature = true;
							}
							
							response.send(utils.Misc.createResponse(canStartApp && canAccessFeature));
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
