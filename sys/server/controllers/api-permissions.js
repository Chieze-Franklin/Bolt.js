var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var superagent = require('superagent');

module.exports = {
	get: function(request, response){
		var searchCriteria = request.query;

		models.permission.find(searchCriteria, function (error, permissions) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(permissions)) {
				response.send(utils.Misc.createResponse(utils.Misc.sanitizePermissions(permissions)));
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	}
};
