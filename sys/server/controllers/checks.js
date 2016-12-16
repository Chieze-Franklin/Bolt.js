var superagent = require('superagent');

var config = require("../config");
var errors = require("../errors");
var models = require("../models");
var utils = require("../utils");

//the request header to check for requests IDs
const X_BOLT_REQ_ID = 'X-Bolt-Req-Id';
const X_BOLT_USER_NAME = 'X-Bolt-User-Name'
const X_BOLT_USER_TOKEN = 'X-Bolt-User-Token';

var __getAppFromReqId = function(id, request) {
	for (var entry of request.contextToReqidMap) {
		if (entry[1] === id) { //value === id
			return entry[0]; //return key
		}
	}
}

module.exports = {
	forAdminRight: function(request, response, next){
		next(); //TODO: check if user has admin privilege
	},
	//check if user has right to start app (dont check if it's a startup app)
	forAppRight: function(request, response, next){
		if (!utils.Misc.isNullOrUndefined(request.body.name)) {
			var appnm = utils.String.trim(request.body.name.toLowerCase());

			var smthn = superagent.get(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/users/@current');
			if(!utils.Misc.isNullOrUndefined(request.get(X_BOLT_USER_NAME))) smthn = smthn.set(X_BOLT_USER_NAME, request.get(X_BOLT_USER_NAME));
			if(!utils.Misc.isNullOrUndefined(request.get(X_BOLT_USER_TOKEN))) smthn = smthn.set(X_BOLT_USER_TOKEN, request.get(X_BOLT_USER_TOKEN));
			smthn
				.end(function(userError, userResponse) {
					if (!utils.Misc.isNullOrUndefined(userError)) {
						response.end(utils.Misc.createResponse(null, userError));
						return;
					}

					var realResponse = userResponse.body;
					if (!utils.Misc.isNullOrUndefined(realResponse.body)) {
						var user = realResponse.body;

						superagent
							.post(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/checks/app-right')
							.send({ app: appnm, user: user.name })
							.end(function(rightError, rightResponse){
								if (!utils.Misc.isNullOrUndefined(rightError)) {
									response.end(utils.Misc.createResponse(null, rightError));
									return;
								}

								var innerRealResponse = rightResponse.body;

								if (!utils.Misc.isNullOrUndefined(innerRealResponse.error)) {
									response.end(utils.Misc.createResponse(null, innerRealResponse.error, innerRealResponse.code, 
										innerRealResponse.errorTraceId, innerRealResponse.errorUserTitle, innerRealResponse.errorUserMessage));
									return;
								}

								var userHasRight = innerRealResponse.body;
								if(userHasRight) {
									next();
								}
								else {
									var err4bd = new Error(errors['334']);
									response.end(utils.Misc.createResponse(null, err4bd, 334));
								}
							});
					}
					else {
						models.app.findOne({ name: appnm, startup: true }, function(errorApp, app){
							if (!utils.Misc.isNullOrUndefined(app)) { //if it is a startup app, allow it to run without a current user
								next();
							}
							else {
								var err4bd = new Error(errors['334']);
								response.end(utils.Misc.createResponse(null, err4bd, 334));
							}
						});
					}
				});
		}
		else {
			var error = new Error(errors['400']);
			response.end(utils.Misc.createResponse(null, error, 400));
		}
	},
	forAppFileRight: function(request, response, next){
		next(); //TODO: check (app-role.files) if user has right to access this :file
	},
	//checks to be sure the app making this request is a system app
	forSystemApp: function(request, response, next){
		var id;
		if (!utils.Misc.isNullOrUndefined(request.reqid)) {
			id = request.reqid;
		}
		else {
			id = request.get(X_BOLT_REQ_ID);
		}

		var name = __getAppFromReqId(id, request);
		var appnm = utils.String.trim(name.toLowerCase());

		if (appnm == 'bolt') {
			//native views
			next();
		}
		else {
			models.app.findOne({ 
				name: appnm, system: true
			}, function(error, app){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else if(utils.Misc.isNullOrUndefined(app)){
					var error = new Error(errors['504']);
					response.end(utils.Misc.createResponse(null, error, 504));
				}
				else{
					next();
				}
			});
		}
	},
	forUserPermToInstall: function(request, response, next){
		next(); //TODO: check if app has user's permission to install an app (remember system apps need no permission)
	}
};
