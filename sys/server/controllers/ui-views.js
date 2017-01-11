var fs = require("fs");
var path = require("path");
var superagent = require('superagent');
var url = require('url');

var config = require("../config");
var errors = require("../errors");
var models = require("../models");
var setup = require("../setup");
var utils = require("../utils");

var __node_modulesDir = path.join(__dirname + './../../../node_modules');
var __sysdir = path.join(__dirname + './../../../sys');

var __loadSetupView = function(request, response){

	var steps = setup.getSteps();
	if(!utils.Misc.isNullOrUndefined(steps) && steps.length > 0) {
		steps.forEach(function(step, index){
			if(index < (steps.length - 1)) step.next = index + 1;

			var requestsSync = step.requestsSync;
			if (!utils.Misc.isNullOrUndefined(requestsSync)) {
				requestsSync.forEach(function(rs){
					rs.endpoint = utils.String.trimStart(rs.endpoint, "/");
				});
			}

			var requests = step.requests;
			if (!utils.Misc.isNullOrUndefined(requests)) {
				requests.forEach(function(r){
					r.endpoint = utils.String.trimStart(r.endpoint, "/");
				});
			}
		});
		response.locals.steps = steps;
	}

	var redirect = setup.getRedirect();
	if(!utils.Misc.isNullOrUndefined(redirect)) {
		redirect = utils.String.trimStart(redirect, "/");
	}
	else {
		redirect = "home";
	}

	var scope = {
		protocol: config.getProtocol(),
		host: config.getHost(),
		port: config.getPort(),

		redirect: redirect,
		reqid: request.reqid,
		title: "Setup"
	};
	//response.locals.title = "Setup";
	response
		.set('Content-type', 'text/html')
		.render('setup.html', scope);
}

module.exports = {
	get: function(request, response){
		superagent
			.get(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/users') //get all registered users
			.end(function(error, usersResponse){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.redirect('/error');
				}
				else {
					var responseError = usersResponse.body.error;
					var users = usersResponse.body.body;

					if (!utils.Misc.isNullOrUndefined(responseError)) {
						var encodedCode = encodeURIComponent(appstartResponse.body.code);
						if(!utils.Misc.isNullOrUndefined(responseError.errorUserTitle) && !utils.Misc.isNullOrUndefined(responseError.errorUserMessage)) {
							var encodedTitle = encodeURIComponent(responseError.errorUserTitle);
							var encodedMessage = encodeURIComponent(responseError.errorUserMessage);
							response.redirect('/error?code=' + encodedCode + '&error_user_title=' + encodedTitle + '&error_user_message=' + encodedMessage);
						}
						else {
							response.redirect('/error?code=' + encodedCode);
						}
					}
					else if (!utils.Misc.isNullOrUndefined(users) && users.length > 0){ //if there are registered users,...
						response.redirect('/login');
					}
					else { //if there are NO registered users, then show them the setup view
						//response
						//	.set(X_BOLT_REQ_ID, __genAppReqId('bolt'))
						//	.redirect('/setup');
						//my own security features won't let me just navigate to this endpoint, so I to load the view using response.render(...)

						__loadSetupView(request, response);
					}
				}
			});	
	},
	getLogin: function(request, response){
		var scope = {
			protocol: config.getProtocol(),
			host: config.getHost(),
			port: config.getPort(),

			success: request.query.success,
			failure: request.query.failure,

			reqid: request.reqid
		};
		response.locals.title = "Login";
		response
			.set('Content-type', 'text/html')
			.render('login.html', scope);
	},
	getLogout: function(request, response){
		var scope = {
			protocol: config.getProtocol(),
			host: config.getHost(),
			port: config.getPort(),

			reqid: request.reqid,
		};
		response.locals.title = "Log Out";
		response
			.set('Content-type', 'text/html')
			.render('logout.html', scope);
	},
	getRequest: function(request, response){
		var scope = {
			protocol: config.getProtocol(),
			host: config.getHost(),
			port: config.getPort(),

			app: request.query.app,
			success: request.query.success,
			failure: request.query.failure,
			permissions: request.query.permissions,

			reqid: request.reqid
		};
		response.locals.title = "Request";
		response
			.set('Content-type', 'text/html')
			.render('request.html', scope);
	},
	getSetup: function(request, response){
		__loadSetupView(request, response);
	},
	getView: function(request, response){
		//get the app that serves that view; if not get our native view; if not found show app for 404; if not show native 404.html

		var app = null;
		var ext = "/" + utils.String.trimStart(utils.String.trim(request.params.view.toLowerCase()), "/");
		models.extension.find({ path: ext }, function(errorExtensions, extensions){
			if (!utils.Misc.isNullOrUndefined(errorExtensions)){
				response.end(utils.Misc.createResponse(null, errorExtensions, 433));
			}
			//check for an app that can serve this view
			else if(!utils.Misc.isNullOrUndefined(extensions) && extensions.length > 0) {
				var rawQuery = url.parse(request.url).query;
				if (extensions.length == 1) {
					app = extensions[0].app + '?route=' + encodeURIComponent(extensions[0].route) 
						+ (utils.Misc.isNullOrUndefined(rawQuery) ? "" : "&query=" + encodeURIComponent(rawQuery));
				}
				else {
					for (var index = 0; index < extensions.length; index++) {
						var extension = extensions[index];
						if (extension.isDefault) {
							app = extension.app + '?route=' + encodeURIComponent(extension.route)
								+ (utils.Misc.isNullOrUndefined(rawQuery) ? "" : "&query=" + encodeURIComponent(rawQuery));
							break;
						}
					}
				}
			}

			//if an app that can serve this view is found
			if (!utils.Misc.isNullOrUndefined(app)) {
				response.redirect('/apps/' + app);
			}
			//check for a native view
			else {
				var native = path.join(__sysdir, 'views', request.params.view + '.html');
				fs.stat(native, function(error, stats) {
					if (utils.Misc.isNullOrUndefined(error) && stats.isFile()){
						var scope = {
							protocol: config.getProtocol(),
							host: config.getHost(),
							port: config.getPort(),

							title: request.params.view,

							item: request.query.item,

							code: request.query.code,
							errorUserTitle: request.query.error_user_title,
							errorUserMessage: request.query.error_user_message,

							reqid: request.reqid
						};
						response
							.set('Content-type', 'text/html')
							.render(request.params.view + '.html', scope);
					}
					else {
						response.redirect('/404?item=' + encodeURIComponent(request.params.view));
					}
				});
			}
		});
	}
};
