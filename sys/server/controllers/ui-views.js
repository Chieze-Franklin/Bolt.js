var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var setup = require("bolt-internal-setup");
var utils = require("bolt-internal-utils");

var fs = require("fs");
var path = require("path");
var Showdown = require("showdown");
var superagent = require('superagent');
var url = require('url');

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
		redirect: redirect,
		token: request.bolt.token,
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
			.get(process.env.BOLT_ADDRESS + '/api/users') //get all registered users
			.end(function(error, usersResponse){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.redirect('/error');
				}
				else {
					var responseError = usersResponse.body.error;
					var users = usersResponse.body.body;

					if (!utils.Misc.isNullOrUndefined(responseError)) {
						var encodedCode = encodeURIComponent(usersResponse.body.code);
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
					else {
						__loadSetupView(request, response);
					}
				}
			});	
	},
	getDownload: function(request, response){
		superagent
			.post(process.env.BOLT_ADDRESS + '/api/apps/package')
			.send({ name: request.query.app, version: request.query.version })
			.end(function(err, res){
				if (!utils.Misc.isNullOrUndefined(err)) {
					response.redirect('/error');
				}
				else {
					var responseError = res.body.error;
					var package = res.body.body;
					//TODO: show package.bolt.dependencies

					if (!utils.Misc.isNullOrUndefined(responseError)) {
						var encodedCode = encodeURIComponent(res.body.code);
						if(!utils.Misc.isNullOrUndefined(responseError.errorUserTitle) && !utils.Misc.isNullOrUndefined(responseError.errorUserMessage)) {
							var encodedTitle = encodeURIComponent(responseError.errorUserTitle);
							var encodedMessage = encodeURIComponent(responseError.errorUserMessage);
							response.redirect('/error?code=' + encodedCode + '&error_user_title=' + encodedTitle + '&error_user_message=' + encodedMessage);
						}
						else {
							response.redirect('/error?code=' + encodedCode);
						}
					}
					else {
						superagent
							.post(process.env.BOLT_ADDRESS + '/api/apps/readme')
							.send({ name: request.query.app, version: request.query.version })
							.end(function(errReadme, resReadme){
								var readme = resReadme.body.body;

								var scope = {
									name: request.query.app,
									version: request.query.version,
									success: request.query.success,

									token: request.bolt.token
								};

								if (!utils.Misc.isNullOrUndefined(package)) {
									var system = false;
									scope.displayName = package.name;
									
									if (!utils.Misc.isNullOrUndefined(package.bolt)) {
										if (!utils.Misc.isNullOrUndefined(package.bolt.system)) system = package.bolt.system;

										if (!utils.Misc.isNullOrUndefined(package.bolt.displayName)) scope.displayName = package.bolt.displayName;
									}

									scope.description = package.description;
									scope.readme = readme;
									scope.system = system;
								}
									
								response.locals.title = "Download";
								response
									.set('Content-type', 'text/html')
									.render('download.html', scope);
							});
					}
				}
			});
	},
	getInstall: function(request, response){
		var scope = {
			app: request.query.app,
			version: request.query.version,
			success: request.query.success,
			failure: request.query.failure,

			token: request.bolt.token
		};
		response.locals.title = "Install";
		response
			.set('Content-type', 'text/html')
			.render('install.html', scope);
	},
	getLogin: function(request, response){
		var scope = {
			success: request.query.success,
			failure: request.query.failure,
			noQuery: request.query.no_query === 'true',

			token: request.bolt.token
		};
		response.locals.title = "Login";
		response
			.set('Content-type', 'text/html')
			.render('login.html', scope);
	},
	getLogout: function(request, response){
		var scope = {
			token: request.bolt.token,
		};
		response.locals.title = "Log Out";
		response
			.set('Content-type', 'text/html')
			.render('logout.html', scope);
	},
	getSetup: function(request, response){
		__loadSetupView(request, response);
	},
	getSideload: function(request, response){
		superagent
			.post(process.env.BOLT_ADDRESS + '/api/apps/local-package')
			.send({ path: request.query.app })
			.end(function(err, res){
				if (!utils.Misc.isNullOrUndefined(err)) {
					response.redirect('/error');
				}
				else {
					var responseError = res.body.error;
					var package = res.body.body;
					//TODO: show package.bolt.dependencies

					if (!utils.Misc.isNullOrUndefined(responseError)) {
						var encodedCode = encodeURIComponent(res.body.code);
						if(!utils.Misc.isNullOrUndefined(responseError.errorUserTitle) && !utils.Misc.isNullOrUndefined(responseError.errorUserMessage)) {
							var encodedTitle = encodeURIComponent(responseError.errorUserTitle);
							var encodedMessage = encodeURIComponent(responseError.errorUserMessage);
							response.redirect('/error?code=' + encodedCode + '&error_user_title=' + encodedTitle + '&error_user_message=' + encodedMessage);
						}
						else {
							response.redirect('/error?code=' + encodedCode);
						}
					}
					else {
						superagent
							.post(process.env.BOLT_ADDRESS + '/api/apps/local-readme')
							.send({ path: request.query.app })
							.end(function(errReadme, resReadme){
								var readme = resReadme.body.body || "";

								var scope = {
									path: request.query.app,

									success: request.query.success,

									token: request.bolt.token
								};

								if (!utils.Misc.isNullOrUndefined(package)) {
									var system = false;
									if (!utils.Misc.isNullOrUndefined(package.bolt.system)) system = package.bolt.system;

									scope.displayName = package.bolt.displayName || package.name;
									scope.description = package.description;
									scope.readme = readme;
									scope.system = system;
								}
									
								response.locals.title = "Sideload";
								response
									.set('Content-type', 'text/html')
									.render('sideload.html', scope);
							});
					}
				}
			});
	},
	getUninstall: function(request, response){
		var scope = {
			app: request.query.app,
			success: request.query.success,
			failure: request.query.failure,

			token: request.bolt.token
		};
		response.locals.title = "Uninstall";
		response
			.set('Content-type', 'text/html')
			.render('uninstall.html', scope);
	},
	getUpdate: function(request, response){
		var scope = {
			app: request.query.app,
			folder: request.query.path,
			version: request.query.version,
			success: request.query.success,
			failure: request.query.failure,

			token: request.bolt.token
		};
		response.locals.title = "Update";
		response
			.set('Content-type', 'text/html')
			.render('update.html', scope);
	},
	getView: function(request, response){
		//get the app that serves that view; if not get our native view; if not found show app for 404; if not show native 404.html

		var extensionApps = [];
		var results = [];
		var ext = "/" + utils.String.trimStart(utils.String.trim(request.params.view.toLowerCase()), "/");
		models.extension.find({ path: ext }, function(errorExtensions, extensions){
			if (!utils.Misc.isNullOrUndefined(errorExtensions)){
				response.end(utils.Misc.createResponse(null, errorExtensions, 433));
			}
			//check for an app that can serve this view
			else if(!utils.Misc.isNullOrUndefined(extensions) && extensions.length > 0) {
				var rawQuery = url.parse(request.url).query;
				if (extensions.length == 1) {
					var app = extensions[0].app + '?route=' + encodeURIComponent(extensions[0].route) 
						+ (utils.Misc.isNullOrUndefined(rawQuery) ? "" : "&query=" + encodeURIComponent(rawQuery));
					extensionApps.push(app);
				}
				else {
					for (var index = 0; index < extensions.length; index++) {
						var extension = extensions[index];
						var app = extension.app + '?route=' + encodeURIComponent(extension.route)
							+ (utils.Misc.isNullOrUndefined(rawQuery) ? "" : "&query=" + encodeURIComponent(rawQuery));
						if (extension.isDefault) {
							extensionApps = [];
							extensionApps.push(app);
							break;
						} else {
							extensionApps.push(app);
							results.push({name: extension.app, path: app, displayName: ''});
						}
					}
				}
			}

			//if an app that can serve this view is found
			if (extensionApps.length == 1) {
				response.redirect('/apps/' + extensionApps[0]);
			}
			//if more than one app can server this view
			else if (extensionApps.length > 1) {
				var loopThroughResults = function(index) {
					if (index >= results.length) {
						var scope = {
							extension: ext,
							results: results,
							token: request.bolt.token
						};
						response
							.set('Content-type', 'text/html')
							.render('chooser.html', scope);
						return;
					}

					var res = results[index];
					models.app.findOne({ name: res.name }, function (appError, app) {
						if (!utils.Misc.isNullOrUndefined(app)) {
							res.app = app;
							results[index] = res;
						}
						loopThroughResults(index + 1);
					});
				}
				loopThroughResults(0);
			}
			//check for a native view
			else {
				var native = path.join(__sysdir, 'views', request.params.view + '.html');
				fs.stat(native, function(error, stats) {
					if (utils.Misc.isNullOrUndefined(error) && stats.isFile()){
						var scope = {
							title: request.params.view,

							item: request.query.item,

							code: request.query.code,
							errorUserTitle: request.query.error_user_title,
							errorUserMessage: request.query.error_user_message,

							token: request.bolt.token
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
