var exec = require('child_process').exec, child;
var express = require("express");
var fs = require("fs");
var http = require("http");
var mongodb = require('mongodb');
var mongoose = require('mongoose'), Schema = mongoose.Schema;
var path = require("path");
var superagent = require('superagent');

var config = require("./sys/server/config");
var configure = require("./sys/server/configure");
var errors = require("./sys/server/errors");
var models = require("./sys/server/models");
var processes = require("./sys/server/processes");
var schemata = require("./sys/server/schemata");
var utils = require("./sys/server/utils");

//---------Helpers

//holds all running contexts
var __runningContexts = [];

//the request header to check for requests IDs
const X_BOLT_REQ_ID = 'X-Bolt-Req-Id';

//holds all the apps' request IDs
var __contextToReqidMap = new Map();
var __destroyAppReqId = function(app) {
	if (__contextToReqidMap.has(app))
		__contextToReqidMap.delete(app);
}
var __genAppReqId = function(app) {
	if (__contextToReqidMap.has(app))
		return __contextToReqidMap.get(app);

	var id = utils.String.getRandomString(24);
	__contextToReqidMap.set(app, id);

	return id;
}
var __getAppForReqId = function(id) {
	for (var entry of __contextToReqidMap) {
		if (entry[1] === id) { //value === id
			return entry[0]; //return key
		}
	}
}
var __isSystemApp = function(id) {
	var systemApps = ['bolt', 'bolt-settings']; //TODO: this list shud be gotten from the database
	var app = __getAppForReqId(id);
	if (utils.Misc.isNullOrUndefined(app))
		return false;
	return (systemApps.indexOf(app.toLowerCase()) > -1);
}

//constructs an appropriate response object
var __getResponse = function(body, error, code, errorTraceId, errorUserTitle, errorUserMessage){
	//TODO: support errorTraceId
	//TODO: errorUserTitle and errorUserMessage should be change from strings to ints (==code) to support localization

	var response = {};

	//set code
	if (!utils.Misc.isNullOrUndefined(code)) {
		response.code = code;
	}
	else {
		if (!utils.Misc.isNullOrUndefined(body))
			response.code = 0;
		else if (!utils.Misc.isNullOrUndefined(error))
			response.code = 1000;
	}

	//set body
	if (!utils.Misc.isNullOrUndefined(body))
		response.body = body;

	//set error
	if (!utils.Misc.isNullOrUndefined(error)){
		response.error = error;

		//set errorTraceId
		if (!utils.Misc.isNullOrUndefined(errorTraceId))
			response.errorTraceId = errorTraceId;

		//set errorUserTitle
		if (!utils.Misc.isNullOrUndefined(errorUserTitle))
			response.errorUserTitle = errorUserTitle; //TODO: this is not the real implementation
		else {
			//TODO: this is not the real implementation
			response.errorUserTitle = response.code;
		}

		//set errorUserMessage
		if (!utils.Misc.isNullOrUndefined(errorUserMessage))
			response.errorUserMessage = errorUserMessage; //TODO: this is not the real implementation
		else {
			//TODO: this is not the real implementation
			response.errorUserMessage = errors[response.code];
		}
	}

	return JSON.stringify(response);
}

var __loadLoginView = function(request, response){
	var scope = {
		protocol: config.getProtocol(),
		host: config.getHost(),
		port: config.getPort(),

		reqid: __genAppReqId('bolt')
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

		reqid: __genAppReqId('bolt'),
		title: "Setup"
	};
	//response.locals.title = "Setup";
	response
		.set('Content-type', 'text/html')
		.render('setup.html', scope);
}

//---------Request Validators
var checkAppUserPermToInstall = function(request, response, next){
	next(); //TODO: check if app has user's permission to install an app (remember system apps need no permission)
}
//checks to be sure the app making this request is a system app
var checkForSystemApp = function(request, response, next){
	var id = request.get(X_BOLT_REQ_ID);
	if(utils.Misc.isNullOrUndefined(id) || !__isSystemApp(id)) { 
		var error = new Error(errors['504']);
		response.end(__getResponse(null, error, 504));
	}
	else {
		next();
	}
}
var checkUserAdminRight = function(request, response, next){
	next(); //TODO: check if user has admin privilege
}
var checkUserAppRight = function(request, response, next){
	next(); //TODO: check if user has right to start :app (dont check if it's a startup app)
}
var checkUserAppFileRight = function(request, response, next){
	next(); //TODO: check if user has right to access this :file
}

//---------API Handlers----------

var api_get = function(request, response){
	response.redirect('/api/help');
}

var api_get_appinfo_app = function(request, response){
	var appnm = utils.String.trim(request.params.app.toLowerCase());
	models.app.findOne({ 
		name: appnm
	}, function(error, app){
		if (!utils.Misc.isNullOrUndefined(error)) {
			response.end(__getResponse(null, error));
		}
		else if(utils.Misc.isNullOrUndefined(app)){
			var err = new Error(errors['403']);
			response.end(__getResponse(null, err, 403));
		}
		else{
			response.send(__getResponse(app));
		}
	});
}

var api_get_apps = function(request, response){
	models.app.find({}, function(error, apps){
		if (!utils.Misc.isNullOrUndefined(error)) {
			response.end(__getResponse(null, error));
		}
		else if(!utils.Misc.isNullOrUndefined(apps)){
			response.send(__getResponse(apps));
		}
		else{
			response.send(__getResponse([]));
		}
	});
}

var api_get_apps_live = function(request, response){
	//var apps = [];
	//__runningContexts.forEach(function(context, index){
	//	apps.push(context.app);
	//});
	//response.send(__getResponse(apps));
	response.send(__getResponse(__runningContexts));
}

var api_get_apps_tag = function(request, response){
	var tag = utils.String.trim(request.params.tag.toLowerCase());
	models.app.find({ 
		tags: tag
	}, function(error, apps){
		if (!utils.Misc.isNullOrUndefined(error)) {
			response.end(__getResponse(null, error));
		}
		else if(!utils.Misc.isNullOrUndefined(apps)){
			response.send(__getResponse(apps));
		}
		else{
			response.send(__getResponse([]));
		}
	});
}

var api_get_fileinfo_app_file = function(request, response){
	var appnm = utils.String.trim(request.params.app.toLowerCase());
	models.app.findOne({ 
		name: appnm
	}, function(error, app){
		if (!utils.Misc.isNullOrUndefined(error)) {
			response.end(__getResponse(null, error));
		}
		else if(utils.Misc.isNullOrUndefined(app)){
			var err = new Error(errors['403']);
			response.end(__getResponse(null, err, 403));
		}
		else{
			var fileInfo;

			var files = app.files;
			for (var file in files){
				if (files.hasOwnProperty(file)){
					if (file === request.params.file) {
						fileInfo = {
							name: file,
							path: files[file]
						};
						break;
					}
				}
			}

			if (!utils.Misc.isNullOrUndefined(fileInfo.path)) {
				fileInfo.fullPath = path.join(__dirname, 'node_modules', app.path, fileInfo.path);
				fs.stat(fileInfo.fullPath, function(fsError, stats) {
					if (!utils.Misc.isNullOrUndefined(fsError)) {
						fileInfo.error = fsError;
					}
					else {
						fileInfo.stats = {
							accessTime: stats.atime,
							creationTime: stats.birthtime,
							isDirectory: stats.isDirectory(),
							isFile: stats.isFile(),
							isSocket: stats.isSocket(),
							modifiedTime: stats.mtime,
							size: stats.size,
							statsChangedTime: stats.ctime,
						};
					}
					response.send(__getResponse(fileInfo));
				});
			}
			else {
				response.send(__getResponse(fileInfo));
			}
		}
	});
}

var api_get_help = function(request, response){
	//response.send(app._router.stack); //run this (comment everything below) to see the structure of 'app._router.stack'

	//TODO: consider making it possible to know the state of an endpoint: deprecated, stable, internal, unstable

	var system = {
		name: config.getName(),
		friendlyName: config.getFriendlyName(),
		version: config.getVersion(),
		friendlyVersion: config.getFriendlyVersion()
	};
	var routes = [];
	var paths = [];
	app._router.stack.forEach(function(r){
		if(r.route && r.route.path){
			var entry = {};
			var entrySummary = "";
			if(r.route.stack && r.route.stack.length > 0){
				var s = r.route.stack[0];
				if(s.method){
					entry.method = s.method;
					entrySummary += s.method + ": ";
				}
				entry.path = r.route.path;
				entrySummary += r.route.path;

				routes.push(entry);
				paths.push(entrySummary);

				/*r.route.stack.forEach(function(s){
					if(s.method){
						entry.method = s.method;
						entrySummary += s.method + ": ";
					}
					entry.path = r.route.path;
					entrySummary += r.route.path;

					routes.push(entry);
					paths.push(entrySummary);
				});*/
			}
		}
	});

	system.paths = paths;
	system.routes = routes;

	response.send(__getResponse(system));
}

var api_get_users = function (request, response) {
	models.user.find({}, function (error, users) {
		if (!utils.Misc.isNullOrUndefined(error)) {
			response.end(__getResponse(null, error));
		}
		else if (!utils.Misc.isNullOrUndefined(users)) {
			response.send(__getResponse(users));
		}
		else {
			response.send(__getResponse([]));
		}
	});
}

var api_post_access = function(request, response){
	//get app
	var appnm;
	if (!utils.Misc.isNullOrUndefined(request.body.app)) {
		appnm = utils.String.trim(request.body.app.toLowerCase());
	}
	else {
		var error = new Error(errors['400']);
		response.end(__getResponse(null, error, 400));
		return;
	}

	//get user
	var username;
	if (!utils.Misc.isNullOrUndefined(request.body.user)) {
		username = utils.String.trim(request.body.user.toLowerCase());
	}
	else {
		//use the current user's name
		if (!utils.Misc.isNullOrUndefined(request.session.user)){
			username = request.session.user.username;
		}
	}

	if (utils.Misc.isNullOrUndefined(username)) { //if username is still null or undefined
		response.send(__getResponse(false));
		return;
	}

	//get user-roles associated with the user
	models.userRoleAssoc.find({ user: username }, function(errorUserRole, userRoles){
		if (!utils.Misc.isNullOrUndefined(errorUserRole)) {
			response.end(__getResponse(null, errorUserRole));
		}
		else if (!utils.Misc.isNullOrUndefined(userRoles)) {
			var loopThroughRoles = function(index) {
				if (index >= userRoles.length) {
					response.send(__getResponse(false));
					return;
				}

				//get app-roles associated with roles in user-roles and app
				var userRole = userRoles[index];
				models.appRoleAssoc.findOne({ app: appnm, role: userRole.role }, function(errorAppRole, appRole) {
					if (!utils.Misc.isNullOrUndefined(errorAppRole)) {
						response.end(__getResponse(null, errorAppRole));
					}
					else if (!utils.Misc.isNullOrUndefined(appRole)) {
						var canStartApp = false;
						var canAccessFeature = false;

						if (!utils.Misc.isNullOrUndefined(appRole.start)) {
							canStartApp = appRole.start;
						}

						if (!utils.Misc.isNullOrUndefined(request.body.feature)) {
							//TODO: there has to be a better way to implment case-INsensitive search
							var lowercaseFeatures = [];
							appRole.features.forEach(function(feature, index){
								lowercaseFeatures.push(feature.toLowerCase());
							});
							canAccessFeature = (lowercaseFeatures.indexOf(request.body.feature.toLowerCase()) > -1);
						}
						else { //if the request doesn't specify the feature to check, then just set canAccessFeature = true
							canAccessFeature = true;
						}
						
						response.send(__getResponse(canStartApp && canAccessFeature));
					}
					else {
						loopThroughRoles(++index);
					}
				});
			}

			loopThroughRoles(0);
		}
		else {
			response.send(__getResponse(false));
		}
	});
}

var api_post_app_get = function(request, response){
	//expects: { app (if app name mission, error code=400; if app name='bolt', error=401), version (optional) } => npm install {app}@{version}
	//calls /api/app/reg after downloading app (if not possible then after package.json and all the files to hash in package.json are downloaded)
	//if (!utils.Misc.isNullOrUndefined(request.body.app))
}

var api_post_app_reg = function(request, response){
	if (!utils.Misc.isNullOrUndefined(request.body.path)) {
		var _path = utils.String.trim(request.body.path);
		fs.readFile(path.join(__dirname, 'node_modules', _path, 'package.json'), function (error, data) {
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(__getResponse(null, error));
			}
			else {
				var package = JSON.parse(data);

				if (utils.Misc.isNullOrUndefined(package.name)) {
					var errr = new Error(errors['400']);
					response.end(__getResponse(null, errr, 400));
					return;
				}

				var appnm = utils.String.trim(package.name.toLowerCase());
				if (appnm === "bolt") { //'bolt' is a special app that is "already installed"
					var errr = new Error(errors['401']);
					response.end(__getResponse(null, errr, 401));
					return;
				}
				models.app.findOne({ name: appnm }, function(err, app){
					if (!utils.Misc.isNullOrUndefined(err)) {
						response.end(__getResponse(null, err));
					}
					else if(utils.Misc.isNullOrUndefined(app)) {
						
						//TODO: copy the bolt client files specified as dependencies into the folders specified; if it fails, stop installation
						//TODO: describe this in 'Installing an App'

						var newApp = new models.app({ 
							name: appnm,
							path: _path
						});
						newApp.description = package.description || "";
						newApp.version = package.version || "";

						if (!utils.Misc.isNullOrUndefined(package.bolt.main)) newApp.main = package.bolt.main;

						newApp.files = package.bolt.files || {};
						if (!utils.Misc.isNullOrUndefined(package.bolt.icon)) newApp.icon = package.bolt.icon;
						if (!utils.Misc.isNullOrUndefined(package.bolt.index)) newApp.index = "/" + utils.String.trimStart(package.bolt.index, "/");
						if (!utils.Misc.isNullOrUndefined(package.bolt.ini)) newApp.ini = "/" + utils.String.trimStart(package.bolt.ini, "/");
						if (!utils.Misc.isNullOrUndefined(package.bolt.install)) newApp.install = "/" + utils.String.trimStart(package.bolt.install, "/");
						newApp.startup = package.bolt.startup || false;
						newApp.tags = package.bolt.tags || [];
						newApp.title = package.bolt.title || package.name;

						if (!utils.Misc.isNullOrUndefined(package.bolt.plugins)) {
							var plugins = package.bolt.plugins;
							for (var plugin in plugins){
								var plug = "/" + utils.String.trimStart(utils.String.trim(plugin.toLowerCase()), "/");
								if (plugins.hasOwnProperty(plugin)){
									var newPlugin = new models.plugin({
										path: plug,
										app: appnm,
										endpoint: plugins[plugin]
									});
									newPlugin.save(); //TODO: check that two plugins dont hv d same path and app
								}
							}
						}

						newApp.package = package;

						var saveNewApp = function(){
							newApp.save(function(saveError, savedApp){
								if (!utils.Misc.isNullOrUndefined(saveError)) {
									response.end(__getResponse(null, saveError, 402));
								}
								else {
									response.send(__getResponse(savedApp));
								}
							});
						};

						if (!utils.Misc.isNullOrUndefined(package.bolt.checks)) {
							var totalHash = "";
							var checksum = function(index){
								if (index >= package.bolt.checks.length) {
									newApp.appHash = utils.Security.hashSync(totalHash); //hash the total hash (primarily to make it shorter)
									saveNewApp();
								}
								else {
									var filename = package.bolt.checks[index];
									var filepath = path.join(__dirname, 'node_modules', _path, filename);
									utils.Security.checksumSync(filepath, function(errChecksum, hash){
										if (!utils.Misc.isNullOrUndefined(hash)) {
											totalHash += hash;
											checksum(++index);
										}
									});
								}
							}
							checksum(0);
						}
						else {
							saveNewApp();
						}
					}
					else{
						var err = new Error(errors['401']);
						response.end(__getResponse(null, err, 401));
					}
				});
			}
		});
	}
	else {
		var error = new Error(errors['410']);
		response.end(__getResponse(null, error, 410));
	}
}

var api_post_app_start = function(request, response){
	if (!utils.Misc.isNullOrUndefined(request.body.app)) {
		var appnm = utils.String.trim(request.body.app.toLowerCase());
		for (var index = 0; index < __runningContexts.length; index++){
			if (__runningContexts[index].name === appnm){
				response.send(__getResponse(__runningContexts[index]));
				return;
			}
		}

		superagent
			.get(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/app-info/' + request.body.app) 
			.end(function(appinfoError, appinfoResponse){
				if (!utils.Misc.isNullOrUndefined(appinfoError)) {
					response.end(__getResponse(null, appinfoError));
					return;
				}

				var realResponse = appinfoResponse.body;
				if (!utils.Misc.isNullOrUndefined(realResponse.error)) {
					response.end(__getResponse(null, realResponse.error, realResponse.code, 
						realResponse.errorTraceId, realResponse.errorUserTitle, realResponse.errorUserMessage));
					return;
				}

				var context = {}
				var app = realResponse.body;

				context.name = app.name;
				context.path = app.path;
				context.app = app;

				var startApp = function() {
					//start a child process for the app
					if(!utils.Misc.isNullOrUndefined(context.app.main)){
						context.host = config.getHost();

						if(!processes.hasProcess(context.name)){
							//pass the context (and a callback) to processes.createProcess()
							//processes.createProcess() will start a new instance of app_process as a child process
							//app_process will send the port it's running on ({child-port}) back to processes.createProcess()
							//processes.createProcess() will send a post request to {host}:{child-port}/start-app, with context as the body
							//{host}:{child-port}/start-app will start app almost as was done before (see __raw/bolt2.js), on a random port
							//processes will receive the new context (containing port and pid) as the reponse, and send it back in the callback
							processes.createProcess(context, function(error, _context){
								if (!utils.Misc.isNullOrUndefined(error)) {
									response.end(__getResponse(null, error));
								}

								context = _context;

								//pass the OS host & port to the app
								var initUrl = context.app.ini;
								if (!utils.Misc.isNullOrUndefined(initUrl)) {
									initUrl = "/" + utils.String.trimStart(initUrl, "/");
									superagent
										.post(config.getProtocol() + '://' + config.getHost() + ':' + context.port + initUrl)
										.send({protocol: config.getProtocol(), host: config.getHost(), port: config.getPort(), reqid: __genAppReqId(context.name)})
										.end(function(initError, initResponse){});
								}

								__runningContexts.push(context);
								response.send(__getResponse(context));
							});
						}
						else{
							context.pid = processes.getAppPid(context.name);
							context.port = processes.getAppPort(context.name);
							response.send(__getResponse(context));
						}
					}
					else
						response.send(__getResponse(context));
				}

				//check the app hash
				if (!utils.Misc.isNullOrUndefined(app.appHash)) {
					var totalHash = "";
					var checksum = function(index){
						if (index >= app.package.bolt.checks.length) {
							var _appHash =  utils.Security.hashSync(totalHash);
							if (app.appHash == _appHash) {
								startApp();
							}
							else {
								var hashError = new Error(errors['404']);
								response.end(__getResponse(null, hashError, 404));
								return;
							}
						}
						else {
							var filename = app.package.bolt.checks[index];
							var filepath = path.join(__dirname, 'node_modules', app.path, filename);
							utils.Security.checksumSync(filepath, function(errChecksum, hash){
								if (!utils.Misc.isNullOrUndefined(hash)) {
									totalHash += hash;
									checksum(++index);
								}
							});
						}
					}
					checksum(0);
				}
				else {
					startApp();
				}
			});
	}
	else {
		var error = new Error(errors['400']);
		response.end(__getResponse(null, error, 400));
	}
}

var api_post_app_stop = function(request, response){
	if (!utils.Misc.isNullOrUndefined(request.body.app)) {
		var appnm = utils.String.trim(request.body.app.toLowerCase());
		for (var index = 0; index < __runningContexts.length; index++){
			if (__runningContexts[index].name === appnm){
				//remove context
				var context = __runningContexts[index];
				__runningContexts.pop(context);

				//remove all request IDs
				__destroyAppReqId(context.name);

				//kill process
				processes.killProcess(context.name); //TODO: haven't tested this

				response.send(__getResponse(context));
				return;
			}
		}

		//if execution gets here then the context wasn't found
		//we throw error "app port missing" because that is the general error thrown when u interact with a non-running app as tho it were running
		var error = new Error(errors['420']);
		response.end(__getResponse(null, error, 420));
	}
	else {
		var error = new Error(errors['400']);
		response.end(__getResponse(null, error, 400));
	}
}

var api_post_approle = function(request, response){
	if(!utils.Misc.isNullOrUndefined(request.body.app) && !utils.Misc.isNullOrUndefined(request.body.role)) {
		var appnm = utils.String.trim(request.body.app.toLowerCase());
		models.app.findOne({ name: appnm }, function(errorApp, app){
			if (!utils.Misc.isNullOrUndefined(errorApp)){
				response.end(__getResponse(null, errorApp));
			}
			else if(utils.Misc.isNullOrUndefined(app)){
				var errApp = new Error(errors['403']);
				response.end(__getResponse(null, errApp, 403));
			}
			else{
				models.role.findOne({ name: request.body.role }, function(errorRole, role){
					if (!utils.Misc.isNullOrUndefined(errorRole)){
						response.end(__getResponse(null, errorRole));
					}
					else if(utils.Misc.isNullOrUndefined(role)){
						var errRole = new Error(errors['303']);
						response.end(__getResponse(null, errRole, 303));
					}
					else{
						models.appRoleAssoc.findOne({ app: app.name, role: role.name }, function(errorAppRole, appRole){
							if (!utils.Misc.isNullOrUndefined(errorAppRole)) {
								response.end(__getResponse(null, errorAppRole));
							}
							else if (utils.Misc.isNullOrUndefined(appRole)) {
								var newAppRoleAssoc = new models.appRoleAssoc({ 
									role: role.name,
									role_id: role._id, 
									app: app.name,
									app_id: app._id 
								});
								newAppRoleAssoc.start = request.body.start || false;
								newAppRoleAssoc.features = request.body.features || [];
								newAppRoleAssoc.save(function(saveError, savedAppRole){
									if (!utils.Misc.isNullOrUndefined(saveError)) {
										response.end(__getResponse(null, saveError, 322));
									}
									else {
										response.send(__getResponse(savedAppRole));
									}
								});
							}
							else {
								var err = new Error(errors['321']);
								response.end(__getResponse(null, err, 321));
							}
						});
					}
				});
			}
		});
	}
	else {
		var error = new Error(errors['320']);
		response.end(__getResponse(null, error, 320));
	}
}

var api_post_role = function(request, response){
	if(!utils.Misc.isNullOrUndefined(request.body.name)){
		models.role.findOne({ name: request.body.name }, function(error, role){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(__getResponse(null, error));
			}
			else if(utils.Misc.isNullOrUndefined(role)){
				var newRole = new models.role({ name: request.body.name });
				if(!utils.Misc.isNullOrUndefined(request.body.isAdmin)){
					newRole.isAdmin = request.body.isAdmin;
				}
				if(!utils.Misc.isNullOrUndefined(request.body.description)){
					newRole.description = request.body.description;
				}
				newRole.save(function(saveError, savedRole){
					if (!utils.Misc.isNullOrUndefined(saveError)) {
						response.end(__getResponse(null, saveError, 302));
					}
					else {
						response.send(__getResponse(savedRole));
					}
				});
			}
			else{
				var err = new Error(errors['301']);
				response.end(__getResponse(null, err, 301));
			}
		});
	}
	else {
		var error = new Error(errors['300']);
		response.end(__getResponse(null, error, 300));
	}
}

var api_post_user = function(request, response){
	if(!utils.Misc.isNullOrUndefined(request.body.username) && !utils.Misc.isNullOrUndefined(request.body.password)){
		var usrnm = utils.String.trim(request.body.username.toLowerCase());
		models.user.findOne({ username: usrnm }, function(error, user){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(__getResponse(null, error));
			}
			else if (utils.Misc.isNullOrUndefined(user)) {
				var newUser = new models.user({ 
					username: usrnm, 
					passwordHash: utils.Security.hashSync(request.body.password + usrnm)
				});
				newUser.save(function(saveError, savedUser){
					if (!utils.Misc.isNullOrUndefined(saveError)) {
						response.end(__getResponse(null, saveError, 202));
					}
					else {
						delete savedUser.passwordHash; //TODO: not working
						response.send(__getResponse(savedUser));
					}
				});
			}
			else {
				var err = new Error(errors['201']);
				response.end(__getResponse(null, err, 201));
			}
		});
	}
	else {
		var error = new Error(errors['200']);
		response.end(__getResponse(null, error, 200));
	}
}

var api_post_user_login = function(request, response){
	if(!utils.Misc.isNullOrUndefined(request.body.username) && !utils.Misc.isNullOrUndefined(request.body.password)){
		var usrnm = utils.String.trim(request.body.username.toLowerCase());
		models.user.findOne({ 
			username: usrnm, 
			passwordHash: utils.Security.hashSync(request.body.password + usrnm) 
		}, function(error, user){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(__getResponse(null, error));
			}
			else if(utils.Misc.isNullOrUndefined(user)){
				request.session.reset();
				var err = new Error(errors['203']);
				response.end(__getResponse(null, err, 203));
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
				response.send(__getResponse(user));
			}
		});
	}
	else {
		var error = new Error(errors['200']);
		response.end(__getResponse(null, error, 200));
	}
}

var api_post_user_logout = function(request, response){
	request.session.reset();
  	response.end(__getResponse(null, null, 0));
}

var api_post_userrole = function(request, response){
	if(!utils.Misc.isNullOrUndefined(request.body.user) && !utils.Misc.isNullOrUndefined(request.body.role)){
		var usrnm = utils.String.trim(request.body.user.toLowerCase());
		models.user.findOne({ username: usrnm }, function(errorUser, user){
			if (!utils.Misc.isNullOrUndefined(errorUser)){
				response.end(__getResponse(null, errorUser));
			}
			else if(utils.Misc.isNullOrUndefined(user)){
				var errUser = new Error(errors['203']);
				response.end(__getResponse(null, errUser, 203));
			}
			else{
				models.role.findOne({ name: request.body.role }, function(errorRole, role){
					if (!utils.Misc.isNullOrUndefined(errorRole)){
						response.end(__getResponse(null, errorRole));
					}
					else if(utils.Misc.isNullOrUndefined(role)){
						var errRole = new Error(errors['303']);
						response.end(__getResponse(null, errRole, 303));
					}
					else{
						models.userRoleAssoc.findOne({ user: user.username, role: role.name }, function(errorUserRole, userRole){
							if (!utils.Misc.isNullOrUndefined(errorUserRole)) {
								response.end(__getResponse(null, errorUserRole));
							}
							else if (utils.Misc.isNullOrUndefined(userRole)) {
								var newUserRoleAssoc = new models.userRoleAssoc({ 
									role: role.name,
									role_id: role._id, 
									user: user.username,
									user_id: user._id 
								});
								newUserRoleAssoc.save(function(saveError, savedUserRole){
									if (!utils.Misc.isNullOrUndefined(saveError)) {
										response.end(__getResponse(null, saveError, 312));
									}
									else {
										response.send(__getResponse(savedUserRole));
									}
								});
							}
							else {
								var err = new Error(errors['311']);
								response.end(__getResponse(null, err, 311));
							}
						});
					}
				});
			}
		});
	}
	else {
		var error = new Error(errors['310']);
		response.end(__getResponse(null, error, 310));
	}
}

var get = function(request, response){
	superagent
		.get(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/users') //check if there's any registered user
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
}

var get_app_app = function(request, response){
	var appnm = utils.String.trim(request.params.app.toLowerCase());
	superagent
		.post(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/app/start')
		.send({ app: appnm })
		.end(function(error, appstartResponse){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.redirect('/error');
			}
			else {
				var responseError = appstartResponse.body.error;
				var context = appstartResponse.body.body;

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
				else if (!utils.Misc.isNullOrUndefined(context)) {
					if(!utils.Misc.isNullOrUndefined(context.port)){
						var index = (!utils.Misc.isNullOrUndefined(context.app.index)) ? "/" + utils.String.trimStart(context.app.index, "/") : "/";
						response.redirect(config.getProtocol() + '://' + context.host + ':' + context.port + index);
					}
					else {
						//TODO: maybe I shud show an error saying no port found for this app 
						//but I don't want to hand-craft any user error message since that will not be localizable
						//so I'll just be lazy here and show a 404
						response.redirect('/404?item=' + encodeURIComponent(appnm));
					}
				}
				else {
					response.redirect('/404?item=' + encodeURIComponent(appnm));
				}
			}
		});
}

var get_file_app_file = function(request, response){
	superagent
		.get(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/file-info/' + request.params.app + '/' + request.params.file)
		.end(function(error, fileinfoResponse){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.redirect('/error');
			}
			else {
				var responseError = fileinfoResponse.body.error;
				var fileInfo = fileinfoResponse.body.body;

				if (!utils.Misc.isNullOrUndefined(responseError)) {
					var encodedCode = encodeURIComponent(fileinfoResponse.body.code);
					if(!utils.Misc.isNullOrUndefined(responseError.errorUserTitle) && !utils.Misc.isNullOrUndefined(responseError.errorUserMessage)) {
						var encodedTitle = encodeURIComponent(responseError.errorUserTitle);
						var encodedMessage = encodeURIComponent(responseError.errorUserMessage);
						response.redirect('/error?code=' + encodedCode + '&error_user_title=' + encodedTitle + '&error_user_message=' + encodedMessage);
					}
					else {
						response.redirect('/error?code=' + encodedCode);
					}
				}
				else if (!utils.Misc.isNullOrUndefined(fileInfo) && !utils.Misc.isNullOrUndefined(fileInfo.fullPath) && !utils.Misc.isNullOrUndefined(fileInfo.stats)) {
					//response.writeHead(301, {Location: 'file:///' + fileInfo.fullPath});
					//response.end();

					response.redirect(301, 'file:///' + fileInfo.fullPath);

					/*var readStream = fs.createReadStream(fileInfo.fullPath);

					readStream.on('open', function () {
					    // This just pipes the read stream to the response object (which goes to the client)
					    readStream.pipe(response);
				  	});

					readStream.on('error', function(err) {
					    response.redirect('/error');
					});*/
				}
				else {
					response.redirect('/404?item=' + encodeURIComponent(request.params.app + '/' + request.params.file));
				}
			}
		});
}

var get_login = function(request, response){
	__loadLoginView(request, response);
}

var get_logout = function(request, response){
	var scope = {
		protocol: config.getProtocol(),
		host: config.getHost(),
		port: config.getPort()
	};
	response.locals.title = "Setup";
	response
		.set('Content-type', 'text/html')
		.render('logout.html', scope);
}

var get_setup = function(request, response){
	__loadSetupView(request, response);
}

var get_view = function(request, response){
	//get the app that serves that view; if not get our native view; if not found show app for 404; if not show native 404.html

	var app = null;
	var plug = "/" + utils.String.trimStart(utils.String.trim(request.params.view.toLowerCase()), "/");
	models.plugin.find({ path: plug }, function(errorPlugins, plugins){
		if (!utils.Misc.isNullOrUndefined(errorPlugins)){
			response.end(__getResponse(null, errorPlugins, 433));
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
			var native = path.join(__dirname, 'sys/views', request.params.view + '.html');
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

						reqid: __genAppReqId('bolt')
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

//---------Endpoints
//TODO: discuss the versioning scheme below with others
/*
How versioning will be done
Different versions of an endpoint are represented using different handlers:
	app.ACTION({endpoint}, {handler}, {handler}_{n}, {handler}_{n-1},...{handler}_1);
For instance:
	app.post('/app', post_app, post_app_2, post_app_3);

When a request comes in, it is (naturally) passed to the first handler. Every handler that receives the request will perform the following:
	if there is no other handler (and, hence, no need to call 'next()', just handle the request)
	else
		check for the header 'Bolt-Version' using "request.headers['bolt-version']" (lowercase) or "request.get('Bolt-Version')" (case-INsensitive)
		if header is present
			if it is the version you are expecting
				handle the request, and do not call 'next()'
			else
				do not handle the request, call 'next()'
			end
		else if header is not present
			handle the request, and do not call 'next()'
		end
*/

var app = configure(express());

//------------API Endpoints--------------
app.get('/api', api_get);

app.post('/api/access', api_post_access);
//TODO: /api/access/:user/:app
//TODO: /api/access/:user/:app/:feature

//installs an app from an online repository (current only npm is supported)
app.post('/api/app/get', checkAppUserPermToInstall, checkUserAdminRight, api_post_app_get);
//TODO: /api/app/reget (update) /api/app/unget (uninstall)

//installs an app from an local repository (current only the node_modules folder is supported)
app.post('/api/app/reg', checkAppUserPermToInstall, checkUserAdminRight, api_post_app_reg);
//TODO: /api/app/rereg (update) /api/app/unreg (uninstall)

//starts the server of the app with the specified name
app.post('/api/app/start', checkUserAppRight, api_post_app_start);

//stops the server of the app with the specified name
app.post('/api/app/stop', checkUserAppRight, api_post_app_stop);

//gets the app info of the app with the specified name
app.get('/api/app-info/:app', api_get_appinfo_app);

//adds an app-role associate to the database
app.post('/api/app-role', checkForSystemApp, api_post_approle);
//TODO: DEL: /api/app-role/ 

//gets an array of app-info for all installed apps
app.get('/api/apps', api_get_apps);

//gets an array of app-info of all running apps
app.get('/api/apps/@live', api_get_apps_live);

//gets an array of app-info for all installed apps with the specified tag
app.get('/api/apps/:tag', api_get_apps_tag);

//TODO: app.get('/api/config', get_config);
//TODO: app.get('/api/config/:property', get_config_property);

//TODO: app.get('/api/file-info/:file') //gets the file info of a file that can be served by any app
//gets the file info of the file with the specified name
app.get('/api/file-info/:app/:file', checkUserAppFileRight, api_get_fileinfo_app_file);

//returns an array of all endpoints, and some extra info
app.get('/api/help', api_get_help);
//TODO: app.get('api/help/:endpoint', get_help_endpoint); //returns the description of an endpoint
//TODO: app.get('api/help/:endpoint/:version', get_help_endpoint_version); //returns the description of a version of an endpoint

//creates a new role
app.post('/api/role', checkForSystemApp, api_post_role);

//TODO: DEL /api/role

//gets the current user
//TODO: app.get('/api/user', );

//adds a user to the database
app.post('/api/user', checkForSystemApp, api_post_user);

//TODO: /api/user/del

//logs a user into the system
app.post('/api/user/login', checkForSystemApp, api_post_user_login);

//logs a user out of the system
app.post('/api/user/logout', checkForSystemApp, api_post_user_logout);

//returns an array of all registered users.
app.get('/api/users', api_get_users);

//TODO: app.get('/api/users/@live', api_get_users_live); //returns an array of all live (currently-logged-in) users

//TODO: app.get('/api/user-info/:user', ); //gets info abt specified user

//adds a user-role associate to the database
app.post('/api/user-role', checkForSystemApp, api_post_userrole);

//TODO: /user-role/del

//------------UI Endpoints--------------

//this UI endpoint displays the appropriate view per time
app.get('/', get);

//this UI endpoint runs the app with the specified name (using default options)
app.get('/app/:app', get_app_app);

//TODO: app.get('/file/:file') //runs a file that can be served by any app
//runs the file with the specified name (using default options)
//ISSUE: does not work properly because browsers seem to block it
app.get('/file/:app/:file', get_file_app_file);

//---------------views

//this UI endpoint displays the login view
app.get('/login', checkForSystemApp, get_login);

//this UI endpoint displays the logout view
app.get('/logout', get_logout);

//TODO: /profile //where you go to change username or password

//this UI endpoint displays the setup view
app.get('/setup', checkForSystemApp, get_setup);

//this UI endpoint displays the specified view
app.get('/:view', get_view);

// catch 404 and forward to error handler
app.use(function(request, response, next) {
  var error = new Error("The endpoint '" + request.path + "' could not be found!");
  next(error);
});

var server = app.listen(config.getPort(), config.getHost(), function(){
	var host = server.address().address;
	var port = server.address().port;
	console.log("Bolt Server listening at http://%s:%s", host, port);

	//listen for 'uncaughtException' so it doesnt crash our system
	process.on('uncaughtException', function(error){
		console.log(error);
	});

	//TODO: how do I check Bolt source hasnt been altered

	var hasStartedStartups = false;

	//start mongodb 
	if (process.platform === 'win32') {
		var mongodbPath = path.join(__dirname, 'sys/bins/win32/mongod.exe');
		var mongodbDataPath = path.join(__dirname, 'sys/data/mongodb');
		child = exec(mongodbPath + ' --dbpath ' + mongodbDataPath + ' --port ' + config.getDbPort());

		child.stdout.on('data', function(data){
			console.log(data);	

			//ok so I'm going to do something probably bad here
			//I want to start the mongodb client and startup apps only after am sure the mongod.exe is ready
			//I don't know of a way to know that yet so I'm going to do a lil dirty work here...
			//By studying the output of mongod.exe on the command line I noticed when ready it emits a line containing
			//		"[initandlisten] waiting for connections on port "
			if(!hasStartedStartups){
				if(data.indexOf("[initandlisten] waiting for connections on port ") > -1){
					hasStartedStartups = true;
					
					mongoose.connect('mongodb://localhost:' + config.getDbPort() + '/bolt');
					mongoose.connection.on('open', function(){
						//start start-up services
						models.app.find({ 
							startup: true
						}, function(err, apps){
							var startups = [];
							if(!err && apps){
								apps.forEach(function(app){
									startups.push(app.name);
								});
							}

							var runStartups = function(index){
								if(index >= startups.length){
									console.log('============================================');
									console.log('');
								}
								else {
									var name = startups[index];
									superagent
										.post(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/app/start')
										.send({ app: name })
										.end(function(appstartError, appstartResponse){
											if (!utils.Misc.isNullOrUndefined(appstartError)) {
												runStartups(++index);
												return;
											}

											var context = appstartResponse.body.body;

											if (!utils.Misc.isNullOrUndefined(context) && !utils.Misc.isNullOrUndefined(context.port)) {
												console.log("Started startup app%s%s at %s:%s",
													(!utils.Misc.isNullOrUndefined(context.name) ? " '" + context.name + "'" : ""), 
													(!utils.Misc.isNullOrUndefined(context.path) ? " (" + context.path + ")" : ""),
													(!utils.Misc.isNullOrUndefined(context.host) ? context.host : ""), 
													context.port);
											}
											runStartups(++index);
										});
								}
							}

							runStartups(0);
						});
					});
				}
			}
		});
		child.stderr.on('data', function(data){ console.log(data); });

		child.on('close', function(code, signal){ 
			//console.log("mongod.exe process ", child.pid, " closing with code ", code); 
		});
	}
	//else if (process.platform === 'linux'){
	//	//ubuntu: sudo service mongodb start
	//}
	//else {}
});