var superagent = require('superagent');

var config = require("../config");
var models = require("../models");
var utils = require("../utils");

module.exports = {
	get: function(request, response){
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

		models.role.find(searchCriteria, function (error, role) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(role)) {
				response.send(utils.Misc.createResponse(role));
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	post: function(request, response){
		if(!utils.Misc.isNullOrUndefined(request.body.name)){
			models.role.findOne({ name: request.body.name }, function(error, role){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else if(utils.Misc.isNullOrUndefined(role)){
					var newRole = new models.role({ name: request.body.name });
					if(!utils.Misc.isNullOrUndefined(request.body.isAdmin)){
						newRole.isAdmin = request.body.isAdmin;
					}
					if(!utils.Misc.isNullOrUndefined(request.body.description)){
						newRole.description = request.body.description;
					}
					newRole.save(function(saveError, savedRole){
						if (!utils.Misc.isNullOrUndefined(saveError)) {
							response.end(utils.Misc.createResponse(null, saveError, 302));
						}
						else {
							response.send(utils.Misc.createResponse(savedRole));
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
	}
};
