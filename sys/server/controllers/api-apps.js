var fs = require('fs');
var path = require("path");
var superagent = require('superagent');

var config = require("../config");
var errors = require("../errors");
var models = require("../models");
var processes = require("../processes");
var utils = require("../utils");

var __node_modulesDir = path.join(__dirname + './../../../node_modules');

//holds all running contexts
var __runningContexts = [];

module.exports = {
	get: function(request, response){
		var searchCriteria = {};
		if (!utils.Misc.isNullOrUndefined(request.query)) {
			searchCriteria = request.query;
		}

		models.app.find(searchCriteria, function(error, apps){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if(!utils.Misc.isNullOrUndefined(apps)){
				response.send(utils.Misc.createResponse(apps));
			}
			else{
				response.send(utils.Misc.createResponse([]));
			}
		});
	},
	getApp: function(request, response){
		var appnm = utils.String.trim(request.params.name.toLowerCase());
		models.app.findOne({ 
			name: appnm
		}, function(error, app){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if(utils.Misc.isNullOrUndefined(app)){
				var err = new Error(errors['403']);
				response.end(utils.Misc.createResponse(null, err, 403));
			}
			else{
				response.send(utils.Misc.createResponse(app));
			}
		});
	},
	getLive: function(request, response){
		//var apps = [];
		//__runningContexts.forEach(function(context, index){
		//	apps.push(context.app);
		//});
		//response.send(utils.Misc.createResponse(apps));
		response.send(utils.Misc.createResponse(__runningContexts));
	},
	/*getTag: function(request, response){
		var tag = utils.String.trim(request.params.tag.toLowerCase());
		response.redirect('/api/apps?tags=' + tag);
	},*/
	post: function(request, response){
		//TODO:
		//expects: { app (if app name (.body.name) missing, error code=400; if app name='bolt', error=401), version (optional) } => npm install {app}@{version}
		//calls /api/app/reg after downloading app (if not possible then after package.json and all the files to hash in package.json are downloaded)
		//if (!utils.Misc.isNullOrUndefined(request.body.name))
		response.send();
	},
	postReg: function(request, response){
		if (!utils.Misc.isNullOrUndefined(request.body.path)) {
			var _path = utils.String.trim(request.body.path);
			fs.readFile(path.join(__node_modulesDir, _path, 'package.json'), function (error, data) {
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else {
					var package = JSON.parse(data);

					if (utils.Misc.isNullOrUndefined(package.name)) {
						var errr = new Error(errors['400']);
						response.end(utils.Misc.createResponse(null, errr, 400));
						return;
					}

					var appnm = utils.String.trim(package.name.toLowerCase());
					if (appnm === "bolt") { //'bolt' is a special app that is "already installed"
						var errr = new Error(errors['401']);
						response.end(utils.Misc.createResponse(null, errr, 401));
						return;
					}
					models.app.findOne({ name: appnm }, function(err, app){
						if (!utils.Misc.isNullOrUndefined(err)) {
							response.end(utils.Misc.createResponse(null, err));
						}
						else if(utils.Misc.isNullOrUndefined(app)) {
							
							//TODO: copy the bolt client files specified as dependencies into the folders specified; if it fails, stop installation
							//TODO: describe this in 'Installing an App'

							var newApp = new models.app({ 
								name: appnm,
								path: _path
							});
							newApp.displayName = package.bolt.displayName || package.name;
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

							if (!utils.Misc.isNullOrUndefined(package.bolt.plugins)) {
								var plugins = package.bolt.plugins;
								for (var plugin in plugins){
									var plug = "/" + utils.String.trimStart(utils.String.trim(plugin.toLowerCase()), "/");
									if (plugins.hasOwnProperty(plugin)){
										var newPlugin = new models.plugin({
											path: plug,
											app: appnm,
											route: plugins[plugin]
										});
										//set type
										if (utils.String.startsWith(plug, "/data/")) {
											newPlugin.type = "data";
										}
										else if (utils.String.startsWith(plug, "/acts/")) {
											newPlugin.type = "action";
										}
										else {
											newPlugin.type = "view";
										}
										newPlugin.save(); //TODO: check that two plugins dont hv d same path and app
									}
								}
							}

							newApp.package = package;

							var saveNewApp = function(){
								newApp.save(function(saveError, savedApp){
									if (!utils.Misc.isNullOrUndefined(saveError)) {
										response.end(utils.Misc.createResponse(null, saveError, 402));
									}
									else {
										//TODO: POST necessary info to savedApp.install endpoint
										response.send(utils.Misc.createResponse(savedApp));
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
										var filepath = path.join(__node_modulesDir, _path, filename);
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
							response.end(utils.Misc.createResponse(null, err, 401));
						}
					});
				}
			});
		}
		else {
			var error = new Error(errors['410']);
			response.end(utils.Misc.createResponse(null, error, 410));
		}
	},
	postStart: function(request, response){
		if (!utils.Misc.isNullOrUndefined(request.body.name)) {
			var appnm = utils.String.trim(request.body.name.toLowerCase());
			for (var index = 0; index < __runningContexts.length; index++){
				if (__runningContexts[index].name === appnm){
					response.send(utils.Misc.createResponse(__runningContexts[index]));
					return;
				}
			}

			superagent
				.get(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/apps/' + request.body.name) 
				.end(function(appinfoError, appinfoResponse){
					if (!utils.Misc.isNullOrUndefined(appinfoError)) {
						response.end(utils.Misc.createResponse(null, appinfoError));
						return;
					}

					var realResponse = appinfoResponse.body;
					if (!utils.Misc.isNullOrUndefined(realResponse.error)) {
						response.end(utils.Misc.createResponse(null, realResponse.error, realResponse.code, 
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
										response.end(utils.Misc.createResponse(null, error));
									}

									context = _context;

									//pass the OS host & port to the app
									var initUrl = context.app.ini;
									if (!utils.Misc.isNullOrUndefined(initUrl)) {
										initUrl = "/" + utils.String.trimStart(initUrl, "/");
										superagent
											.post(config.getProtocol() + '://' + config.getHost() + ':' + context.port + initUrl)
											.send({ 
												protocol: config.getProtocol(), 
												host: config.getHost(), 
												port: config.getPort(), 
												appPort: context.port,
												reqid: request.genAppReqId(context.name)
											})
											.end(function(initError, initResponse){});
									}

									__runningContexts.push(context);
									response.send(utils.Misc.createResponse(context));
								});
							}
							else{
								context.pid = processes.getAppPid(context.name);
								context.port = processes.getAppPort(context.name);
								response.send(utils.Misc.createResponse(context));
							}
						}
						else
							response.send(utils.Misc.createResponse(context));
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
									response.end(utils.Misc.createResponse(null, hashError, 404));
									return;
								}
							}
							else {
								var filename = app.package.bolt.checks[index];
								var filepath = path.join(__node_modulesDir, app.path, filename);
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
			response.end(utils.Misc.createResponse(null, error, 400));
		}
	},
	postStop: function(request, response){
		if (!utils.Misc.isNullOrUndefined(request.body.name)) {
			var appnm = utils.String.trim(request.body.name.toLowerCase());
			for (var index = 0; index < __runningContexts.length; index++){
				if (__runningContexts[index].name === appnm){
					//remove context
					var context = __runningContexts[index];
					__runningContexts.pop(context);

					//remove all request IDs
					request.destroyAppReqId(context.name); //TODO: test this

					//kill process
					processes.killProcess(context.name); //TODO: haven't tested this

					response.send(utils.Misc.createResponse(context));
					return;
				}
			}

			//if execution gets here then the context wasn't found
			//we throw error "app port missing" because that is the general error thrown when u interact with a non-running app as tho it were running
			var error = new Error(errors['420']);
			response.end(utils.Misc.createResponse(null, error, 420));
		}
		else {
			var error = new Error(errors['400']);
			response.end(utils.Misc.createResponse(null, error, 400));
		}
	}
};
