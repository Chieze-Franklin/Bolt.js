var fs = require("fs");
var path = require("path");
var superagent = require('superagent');

var config = require("../config");
var models = require("../models");
var utils = require("../utils");

var __sysdir = path.join(__dirname + './../../../sys');

var __loadLoginView = function(request, response){
	var scope = {
		protocol: config.getProtocol(),
		host: config.getHost(),
		port: config.getPort(),

		reqid: request.redid
	};
	response.locals.title = "Login";
	response
		.set('Content-type', 'text/html')
		.render('login.html', scope);
}

var __loadSetupView = function(request, response){
	var scope = {
		protocol: config.getProtocol(),
		host: config.getHost(),
		port: config.getPort(),

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
						if (!utils.Misc.isNullOrUndefined(request.session) && !utils.Misc.isNullOrUndefined(request.session.user)) { //a user is logged in, load the home view
							response.redirect('/home');
						}
						else { //NO user is logged in, show login view
							//response
							//	.set(X_BOLT_REQ_ID, __genAppReqId('bolt'))
							//	.redirect('/login');
							//my own security features won't let me just navigate to this endpoint, so I to load the view using response.render(...)
							__loadLoginView(request, response);
						}
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
		__loadLoginView(request, response);
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
	getSetup: function(request, response){
		__loadSetupView(request, response);
	},
	getView: function(request, response){
		//get the app that serves that view; if not get our native view; if not found show app for 404; if not show native 404.html

		var app = null;
		var plug = "/" + utils.String.trimStart(utils.String.trim(request.params.view.toLowerCase()), "/");
		models.plugin.find({ path: plug }, function(errorPlugins, plugins){
			if (!utils.Misc.isNullOrUndefined(errorPlugins)){
				response.end(utils.Misc.createResponse(null, errorPlugins, 433));
			}
			//check for an app that can serve this view
			else if(!utils.Misc.isNullOrUndefined(plugins) && plugins.length > 0) {
				if (plugins.length == 1) {
					app = plugins[0].app;
				}
				else {
					for (var index = 0; index < plugins.length; index++) {
						var plugin = plugins[index];
						if (plugin.isDefault) {
							app = plugin.app;
							break;
						}
					}
				}
			}

			//if an app that can serve this view is found
			if (app) {
				response.redirect('/app/' + app);
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
