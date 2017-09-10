var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

//var fs = require("fs");
var path = require("path");
var superagent = require('superagent');

var __publicDir = path.join(__dirname + './../../../public');

module.exports = {
	getUserProfile: function(request, response){
		var param = request.params[0];

		var scope = {
			token: request.bolt.token
		};

		if (param.indexOf("/") == -1) {
			if (param == '') {
				if (request.user) {
					scope.user = request.user;
					scope.editable = true;
					response.render('@', scope);
				}
				else {
					scope.error = {
						title: "No username specified!",
						message: "Please specify the username of the user whose info you would like to see."
					};
					response.render('@', scope);
				}
			}
			else {
				models.user.findOne({name: param}, function (error, user) {
					if (user) {
						if (request.user) {
							scope.user = user;
							scope.editable = (user.name.toLowerCase() == request.user.name.toLowerCase());
							response.render('@', scope);
						}
						else {
							scope.user = user;
							scope.editable = false;
							response.render('@', scope);
						}
					}
					else {
						scope.error = {
							title: "No user found!",
							message: "No user could be found with the username '" + param + "'."
						};
						response.render('@', scope);
					}
				});
			}
		}
		else {
			//
		}
	}
};
