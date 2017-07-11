var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var superagent = require('superagent');

module.exports = {
	delete: function(request, response){
		var searchCriteria = request.query;

		models.appUserAssoc.find(searchCriteria, function (error, appUsers) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(appUsers)) {
				models.appUserAssoc.remove(searchCriteria, function (removeError) {
					if (!utils.Misc.isNullOrUndefined(removeError)) {
						response.end(utils.Misc.createResponse(null, removeError));
					}
					else {
						appUsers = utils.Misc.sanitizeAppUsers(appUsers);
						appUsers.forEach(function(appUser){
							utils.Events.fire('app-user-deleted', { body: appUser }, request.bolt.token, function(eventError, eventResponse){});
						});
						response.send(utils.Misc.createResponse(appUsers));
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

		models.appUserAssoc.find(searchCriteria, function (error, appUsers) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(appUsers)) {
				response.send(utils.Misc.createResponse(utils.Misc.sanitizeAppUsers(appUsers)));
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	post: function(request, response){
		if(!utils.Misc.isNullOrUndefined(request.body.app) && !utils.Misc.isNullOrUndefined(request.body.user)) {
			var appnm = utils.String.trim(request.body.app.toLowerCase());
			var usernm = utils.String.trim(request.body.user.toLowerCase());
			models.app.findOne({ name: appnm }, function(errorApp, app){
				if (!utils.Misc.isNullOrUndefined(errorApp)){
					response.end(utils.Misc.createResponse(null, errorApp));
				}
				else if(utils.Misc.isNullOrUndefined(app)){
					var errApp = new Error(errors['403']);
					response.end(utils.Misc.createResponse(null, errApp, 403));
				}
				else{
					models.user.findOne({ name: usernm }, function(errorUser, user){
						if (!utils.Misc.isNullOrUndefined(errorUser)){
							response.end(utils.Misc.createResponse(null, errorUser));
						}
						else if(utils.Misc.isNullOrUndefined(user)){
							var errUser = new Error(errors['203']);
							response.end(utils.Misc.createResponse(null, errUser, 203));
						}
						else{
							models.appUserAssoc.findOne({ app: app.name, user: user.name }, function(errorAppUser, appUser){
								if (!utils.Misc.isNullOrUndefined(errorAppUser)) {
									response.end(utils.Misc.createResponse(null, errorAppUser));
								}
								else if (utils.Misc.isNullOrUndefined(appUser)) {
									var newAppUserAssoc = new models.appUserAssoc({ 
										app: app.name,
										app_id: app._id,
										user: user.name,
										user_id: user._id
									});
									newAppUserAssoc.starts = request.body.starts || 0;
									newAppUserAssoc.save(function(saveError, savedAppUser){
										if (!utils.Misc.isNullOrUndefined(saveError)) {
											response.end(utils.Misc.createResponse(null, saveError, 342));
										}
										else {
											savedAppUser = utils.Misc.sanitizeAppUser(savedAppUser);
											utils.Events.fire('app-user-created', { body: savedAppUser }, request.bolt.token, function(eventError, eventResponse){});
											response.send(utils.Misc.createResponse(savedAppUser));
										}
									});
								}
								else {
									var err = new Error(errors['341']);
									response.end(utils.Misc.createResponse(null, err, 341));
								}
							});
						}
					});
				}
			});
		}
		else {
			var error = new Error(errors['340']);
			response.end(utils.Misc.createResponse(null, error, 340));
		}
	}
};
