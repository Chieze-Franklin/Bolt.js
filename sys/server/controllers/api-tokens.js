var config = require("bolt-internal-config");
var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var jwt = require('jwt-simple');
var superagent = require('superagent');

module.exports = {
	getObject: function(request, response){
		var object = jwt.decode(request.params.token, config.getSessionSecret());
		response.send(utils.Misc.createResponse(object));
	},
	post: function(request, response){
		if(!utils.Misc.isNullOrUndefined(request.body.object)) {
			var token = jwt.encode(request.body.object, config.getSessionSecret());
			response.send(utils.Misc.createResponse(token));
		}
		else {
			var error = new Error(errors['510']);
			response.end(utils.Misc.createResponse(null, error, 510));
		}
	}
};
