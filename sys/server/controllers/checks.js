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
		if (!utils.Misc.isNullOrUndefined(request.get(X_BOLT_REQ_ID))) {
			id = request.get(X_BOLT_REQ_ID);
		}
		else {
			var error = new Error(errors['110']);
			response.end(utils.Misc.createResponse(null, error, 110));
			return;
		}

		var name = __getAppFromReqId(id, request);
		if (utils.Misc.isNullOrUndefined(name)) {
			var error = new Error(errors['113']);
			response.end(utils.Misc.createResponse(null, error, 113));
			return;
		}
		var appnm = utils.String.trim(name.toLowerCase());

		if (appnm == 'bolt') {
			//native views
			next();
		}
		else {
			models.app.findOne({ 
				name: appnm, system: true
			}, function(appError, app){
				if (!utils.Misc.isNullOrUndefined(appError)) {
					response.end(utils.Misc.createResponse(null, appError));
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
	},

	//checks if this app has the right to access a database (actually a collection in the database)
	forDbAccess: function(request, response, next) {
		var id;
		if (!utils.Misc.isNullOrUndefined(request.get(X_BOLT_REQ_ID))) {
			id = request.get(X_BOLT_REQ_ID);
		}
		else {
			var error = new Error(errors['110']);
			response.end(utils.Misc.createResponse(null, error, 110));
			return;
		}

		var name = __getAppFromReqId(id, request);
		if (utils.Misc.isNullOrUndefined(name)) {
			var error = new Error(errors['113']);
			response.end(utils.Misc.createResponse(null, error, 113));
			return;
		}
		var appnm = utils.String.trim(name.toLowerCase());
		var dbOwner = request.body.db || request.body.app || appnm;

		models.collection.findOne({ name: request.params.collection, app: dbOwner }, function(collError, collection){
			if (!utils.Misc.isNullOrUndefined(collError)){
				response.end(utils.Misc.createResponse(null, collError));
			}
			else if(utils.Misc.isNullOrUndefined(collection)){
				var errUser = new Error(errors['703']);
				response.end(utils.Misc.createResponse(null, errUser, 703));
			}
			else {
				//allow the owner to pass
				if (appnm.toLowerCase() == collection.app.toLowerCase()) next();

				//check if this is a guest app
				else if (utils.Misc.isNullOrUndefined(collection.guests)) { //no guest allowed
					var error = new Error(errors['704']);
					response.end(utils.Misc.createResponse(null, error, 704));
				}
				else if ("*" == collection.guests) next(); //every body is allowed
				else { //there is a guest list; are u invited?
					if (collection.guests.map(function(value){ return value.toLowerCase(); }).indexOf(appnm) > -1) next();
					else {
						var error = new Error(errors['704']);
						response.end(utils.Misc.createResponse(null, error, 704));
					}
				}
			}
		});
	},
	//gets the DB name from the request, and creates the request.db field to hold the value
	getDbName: function(request, response, next){
		if (!utils.Misc.isNullOrUndefined(request.body.db)) {
			request.db = request.body.db;
		}
		else if (!utils.Misc.isNullOrUndefined(request.body.app)) {
			request.db = request.body.app;
		}
		else {
			var id;
			if (!utils.Misc.isNullOrUndefined(request.get(X_BOLT_REQ_ID))) {
				id = request.get(X_BOLT_REQ_ID);
			}
			else {
				var error = new Error(errors['110']);
				response.end(utils.Misc.createResponse(null, error, 110));
				return;
			}

			var name = __getAppFromReqId(id, request);
			if (utils.Misc.isNullOrUndefined(name)) {
				var error = new Error(errors['113']);
				response.end(utils.Misc.createResponse(null, error, 113));
				return;
			}
			var appnm = utils.String.trim(name.toLowerCase());
			request.db = appnm;
		}

		next();
	},
	//checks if this app owns the database (actually a collection in the database)
	forDbOwner: function(request, response, next) {
		var id;
		if (!utils.Misc.isNullOrUndefined(request.get(X_BOLT_REQ_ID))) {
			id = request.get(X_BOLT_REQ_ID);
		}
		else {
			var error = new Error(errors['110']);
			response.end(utils.Misc.createResponse(null, error, 110));
			return;
		}

		var name = __getAppFromReqId(id, request);
		if (utils.Misc.isNullOrUndefined(name)) {
			var error = new Error(errors['113']);
			response.end(utils.Misc.createResponse(null, error, 113));
			return;
		}
		var appnm = utils.String.trim(name.toLowerCase());
		var dbOwner = request.body.db || request.body.app || appnm;

		models.collection.findOne({ name: request.params.collection, app: dbOwner }, function(collError, collection){
			if (!utils.Misc.isNullOrUndefined(collError)){
				response.end(utils.Misc.createResponse(null, collError));
			}
			else if(utils.Misc.isNullOrUndefined(collection)){
				var errUser = new Error(errors['703']);
				response.end(utils.Misc.createResponse(null, errUser, 703));
			}
			else {
				//allow the owner to pass
				if (appnm.toLowerCase() == collection.app.toLowerCase()) next();
				else { //no guest allowed
					var error = new Error(errors['704']);
					response.end(utils.Misc.createResponse(null, error, 704));
				}
			}
		});
	}
};
