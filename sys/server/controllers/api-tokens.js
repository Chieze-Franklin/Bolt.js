var jwt = require('jwt-simple');
var superagent = require('superagent');

var config = require("../config");
var errors = require("../errors");
var models = require("../models");
var utils = require("../utils");

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
