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

		models.user.find(searchCriteria, function (error, users) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if (!utils.Misc.isNullOrUndefined(users)) {
				response.send(utils.Misc.createResponse(users));
			}
			else {
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	post: function(request, response){
		if(!utils.Misc.isNullOrUndefined(request.body.username) && !utils.Misc.isNullOrUndefined(request.body.password)){
			var usrnm = utils.String.trim(request.body.username.toLowerCase());
			models.user.findOne({ username: usrnm }, function(error, user){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else if (utils.Misc.isNullOrUndefined(user)) {
					var newUser = new models.user({ 
						username: usrnm, 
						passwordHash: utils.Security.hashSync(request.body.password + usrnm)
					});
					newUser.save(function(saveError, savedUser){
						if (!utils.Misc.isNullOrUndefined(saveError)) {
							response.end(utils.Misc.createResponse(null, saveError, 202));
						}
						else {
							delete savedUser.passwordHash; //TODO: not working
							response.send(utils.Misc.createResponse(savedUser));
						}
					});
				}
				else {
					var err = new Error(errors['201']);
					response.end(utils.Misc.createResponse(null, err, 201));
				}
			});
		}
		else {
			var error = new Error(errors['200']);
			response.end(utils.Misc.createResponse(null, error, 200));
		}
	},
	postLogin: function(request, response){
		if(!utils.Misc.isNullOrUndefined(request.body.username) && !utils.Misc.isNullOrUndefined(request.body.password)){
			var usrnm = utils.String.trim(request.body.username.toLowerCase());
			models.user.findOne({ 
				username: usrnm, 
				passwordHash: utils.Security.hashSync(request.body.password + usrnm) 
			}, function(error, user){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else if(utils.Misc.isNullOrUndefined(user)){
					request.session.reset();
					var err = new Error(errors['203']);
					response.end(utils.Misc.createResponse(null, err, 203));
				}
				else{
					if (user.isBlocked) { //TODO: test this
						request.session.reset();
					}
					else {
						user.visits+=1;
						user.save();
						delete user.passwordHash; //TODO: not working
						request.session.user = user;
						response.locals.user = user;
					}
					response.send(utils.Misc.createResponse(user));
				}
			});
		}
		else {
			var error = new Error(errors['200']);
			response.end(utils.Misc.createResponse(null, error, 200));
		}
	},
	postLogout: function(request, response){
		request.session.reset();
	  	response.end(utils.Misc.createResponse(null, null, 0));
	}
};
