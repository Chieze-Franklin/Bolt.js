var config = require("bolt-internal-config");
var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var getPackageReadme = require('get-package-readme')
var fs = require('fs');
var fse = require('fs-extra');
var mongodb = require('mongodb');
var npm = require('npm-programmatic');
var packageJson = require("pkg.json");
var path = require("path");
var superagent = require('superagent');

var processes = require("../processes");

var __boltDir = path.join(__dirname + './../../../');
var __node_modulesDir = path.join(__dirname + './../../../node_modules');
var __publicDir = path.join(__dirname + './../../../public');

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
				response.send(utils.Misc.createResponse(utils.Misc.sanitizeApps(apps)));
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
				response.send(utils.Misc.createResponse(utils.Misc.sanitizeApp(app)));
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
		//TODO: support bower

		if (!utils.Misc.isNullOrUndefined(request.body.name)) {
			var appnm = utils.String.trim(request.body.name.toLowerCase());
			if (appnm === "bolt") { //'bolt' is a special app that is "already installed"
				var errr = new Error(errors['401']);
				response.end(utils.Misc.createResponse(null, errr, 401));
				return;
			}

			var version = "";
			if (!utils.Misc.isNullOrUndefined(request.body.version)) {
				version = "@" + request.body.version;
			}

			//using child_process
			/*var exec = require('child_process').exec, child;
			 child = exec('npm install ' + appnm + version,
			 function (error, stdout, stderr) {
			     console.log('stdout: ' + stdout);
			     console.log('stderr: ' + stderr);
			     if (error !== null) {
			          console.log('exec error: ' + error);
			     }
			 });*/

			//using require('npm')
			/*npm.load({}, function (loadError) {
				if (!utils.Misc.isNullOrUndefined(loadError)) {
					response.end(utils.Misc.createResponse(null, loadError));
				}
				else {
					npm.commands.install([appnm + version], function (installError, installData) {
						//check for error, do stuff
					});
				}

				npm.on('log', function(message) {
				    //log installation progress
				    console.log(message);
				});
			});*/

			//using require('enpeem')
			//see: https://www.npmjs.com/package/enpeem

			//using require('npm-programmatic')
			npm.install([appnm + version], {
		        cwd: __boltDir
		    })
		    .then(function(){
		    	console.log("success!!!");
		    	utils.Events.fire('app-downloaded', { body: appnm }, request.appToken, function(eventError, eventResponse){});
		        //call /api/apps/reg
		        superagent
					.post(process.env.BOLT_ADDRESS + '/api/apps/reg')
					.send({ path: appnm, startup: request.body.startup || false, system: request.body.system || false })
					.end(function(appregError, appregResponse){
						if (!utils.Misc.isNullOrUndefined(appregError)) {
							response.end(utils.Misc.createResponse(null, appregError));
						}
						else {console.log(appregResponse.body);
							response.send(utils.Misc.createResponse(appregResponse.body));
						}
					});
		    })
		    .catch(function(){
		        var error = new Error(errors['415']);
				response.end(utils.Misc.createResponse(null, error, 415));
		    });
		}
		else {
			var error = new Error(errors['400']);
			response.end(utils.Misc.createResponse(null, error, 400));
		}
	},
	postPackage: function(request, response){
		if (!utils.Misc.isNullOrUndefined(request.body.name)) {
			var appnm = utils.String.trim(request.body.name);
			var version = "latest";
			if (!utils.Misc.isNullOrUndefined(request.body.version)) {
				version = utils.String.trim(request.body.version);
			}
			packageJson(appnm, version, function (error, data) {
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else {
					response.send(utils.Misc.createResponse(data));
				}
			});
		}
		else {
			var error = new Error(errors['400']);
			response.end(utils.Misc.createResponse(null, error, 400));
		}
	},
	postReadme: function(request, response){
		if (!utils.Misc.isNullOrUndefined(request.body.name)) {
			var appnm = utils.String.trim(request.body.name);
			//another option: https://www.npmjs.com/package/readme-getter
			getPackageReadme(appnm, function (error, data) {
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else {
					response.send(utils.Misc.createResponse(data));
				}
			});
		}
		else {
			var error = new Error(errors['400']);
			response.end(utils.Misc.createResponse(null, error, 400));
		}
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

					if (!utils.Misc.isNullOrUndefined(package.bolt.target)) {
						var target = package.bolt.target;
						var min = config.getMinimumVersion();
						var version = config.getVersion();
						if (target < min || target > version) {
							var errr = new Error(errors['414']);
							response.end(utils.Misc.createResponse(null, errr, 414));
							return;
						}
					}

					models.app.findOne({ name: appnm }, function(err, app){
						if (!utils.Misc.isNullOrUndefined(err)) {
							response.end(utils.Misc.createResponse(null, err));
						}
						else if(utils.Misc.isNullOrUndefined(app)) {

							var newApp = new models.app({ 
								name: appnm,
								path: _path
							});
							newApp.displayName = package.bolt.displayName || package.name;
							newApp.description = package.description || "";
							newApp.version = package.version || "";

							if (!utils.Misc.isNullOrUndefined(package.bolt.module)) newApp.module = package.bolt.module;

							/*a module can't have/do the things in this block
							* a module can't have 'main'
							* a module can't have 'index'
							* a module can't have 'startup' privileges
							* a module can't register extensions
							*/
							if (!package.bolt.module) {
								if (!utils.Misc.isNullOrUndefined(package.bolt.main)) newApp.main = package.bolt.main;

								if (!utils.Misc.isNullOrUndefined(package.bolt.index)) newApp.index = "/" + utils.String.trimStart(package.bolt.index, "/");
								if (!utils.Misc.isNullOrUndefined(package.bolt.ini)) newApp.ini = "/" + utils.String.trimStart(package.bolt.ini, "/");
								if (!utils.Misc.isNullOrUndefined(package.bolt.install)) newApp.install = "/" + utils.String.trimStart(package.bolt.install, "/");

								newApp.startup = false;
								if (!utils.Misc.isNullOrUndefined(request.body.startup)) newApp.startup = request.body.startup;
								else if (!utils.Misc.isNullOrUndefined(package.bolt.startup)) newApp.startup = package.bolt.startup;

								if (!utils.Misc.isNullOrUndefined(package.bolt.extensions)) {
									var extensions = package.bolt.extensions;
									for (var extension in extensions){
										var ext = "/" + utils.String.trimStart(utils.String.trim(extension.toLowerCase()), "/");
										if (extensions.hasOwnProperty(extension)){
											var newExtension = new models.extension({
												path: ext,
												app: appnm,
												route: extensions[extension]
											});
											//set type
											if (utils.String.startsWith(ext, "/acts/")) {
												newExtension.type = "action";
											}
											else if (utils.String.startsWith(ext, "/data/")) {
												newExtension.type = "datum";
											}
											else if (utils.String.startsWith(ext, "/files/")) {
												newExtension.type = "file";
											}
											//listeners|handlers
											else {
												newExtension.type = "view";
											}
											newExtension.save();
										}
									}
								}
							}

							//for now we allow modules to be 'system' apps bcuz u need 'system' privilege to install routers
							newApp.system = false;
							if (!utils.Misc.isNullOrUndefined(request.body.system)) newApp.system = request.body.system;
							else if (!utils.Misc.isNullOrUndefined(package.bolt.system)) newApp.system = package.bolt.system;

							newApp.files = package.bolt.files || {};
							if (!utils.Misc.isNullOrUndefined(package.bolt.order)) newApp.order = package.bolt.order;
							newApp.tags = package.bolt.tags || [];

							//even a module can register hooks, but only web and function (and router, when we implement it) hooks
							if (!utils.Misc.isNullOrUndefined(package.bolt.hooks)) {
								var hooks = package.bolt.hooks;
								for (var hook in hooks){
									if (hooks.hasOwnProperty(hook)) {
										hook = hook.replace("\\", "/");

										var publisher, evnt;

										if (hook.indexOf("/") == -1) {
											publisher = "*";
											evnt = hook;
										}
										else {
											publisher = hook.substring(0, hook.indexOf("/"));
											if (publisher == "") publisher = "*";

											evnt = hook.substr(hook.indexOf("/") + 1);
											if (evnt == "") evnt = "*";
										}

										var newHook = new models.hook({
											event: evnt,
											publisher: publisher,
											subscriber: appnm
										});

										var hookObj = hooks[hook];
										if (hookObj.constructor === String) {
											newHook.route = hookObj;
										}
										else {
											if (!utils.Misc.isNullOrUndefined(hookObj.route)) newHook.route = hookObj.route;
											if (!utils.Misc.isNullOrUndefined(hookObj.type)) newHook.type = hookObj.type;
										}

										newHook.save();
									}
								}
							}

							//even a module can register collections, especially now that we have "tenants"
							if (!utils.Misc.isNullOrUndefined(package.bolt.collections)) {
								var collections = package.bolt.collections;
								for (var collection in collections) {
									if (collections.hasOwnProperty(collection)) {
										var newCollection = new models.collection({
											name: collection,
											app: appnm,
											database: appnm
										});

										var collObj = collections[collection];
										if (collObj.constructor === Array || collObj.constructor === String) {
											newCollection.guests = collObj;
										}
										else if (!utils.Misc.isNullOrUndefined(collObj.guests)) newCollection.guests = collObj.guests;

										if (!utils.Misc.isNullOrUndefined(collObj.tenants)) newCollection.tenants = collObj.tenants;
										
										/*
										//create an actual capped collection named: appnm + '-' + newCollection.name
										var MongoClient = mongodb.MongoClient;
										MongoClient.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI || process.env.BOLT_DB_URI, function(error, db) {
											if (!utils.Misc.isNullOrUndefined(db)) 
												db.createCollection(appnm + '-' + newCollection.name.toLowerCase(), {capped:true, size:5242880, max:5000});//TODO: config.getMax()...
										});

										//I once encountered some little issues working with capped collections on mlab.com, so I'm skeptical of allowing it here.
										//Also, even if we do allow capped collections, after a system reset (or if the app that owns the collection drops it) 
										//the next time the app writes to its collection, an uncapped version is created automatically
										*/

										newCollection.save();
									}
								}
							}

							if (!utils.Misc.isNullOrUndefined(package.bolt.routers)) {
								var routers = package.bolt.routers;
								for (var router in routers) {
									if (routers.hasOwnProperty(router)) {
										var newRouter = new models.router({
											name: router,
											app: appnm,
											path: _path
										});

										var rtrObj = routers[router];
										if (rtrObj.constructor === String) {
											newRouter.main = rtrObj;
										}
										else {
											newRouter.main = rtrObj.main;
											if (!utils.Misc.isNullOrUndefined(rtrObj.root)) newRouter.root = rtrObj.root;
											if (!utils.Misc.isNullOrUndefined(rtrObj.order)) newRouter.order = rtrObj.order;
										}

										newRouter.save(function(saveRtrError, savedRouter){
											if (utils.Misc.isNullOrUndefined(saveRtrError) && !utils.Misc.isNullOrUndefined(savedRouter)) {
												if (newApp.system) {
													//remove '$_'
													request.removeErrorHandlerMiddleware(request.app);

													//load router
													var routerObject = require(path.join(__node_modulesDir, savedRouter.path, savedRouter.main));
													if (utils.Misc.isNullOrUndefined(savedRouter.root)) {
							                            request.app.use(routerObject);
							                        } else {
							                            request.app.use("/" + utils.String.trimStart(savedRouter.root, "/"), routerObject);
							                        }
							                        console.log("Loaded router%s%s%s",
							                                (!utils.Misc.isNullOrUndefined(savedRouter.name)
							                            ? " '" + savedRouter.name + "'"
							                            : ""),
							                                (!utils.Misc.isNullOrUndefined(savedRouter.app)
							                            ? " (" + savedRouter.app + ")"
							                            : ""),
							                                (!utils.Misc.isNullOrUndefined(savedRouter.root)
							                            ? " on " + savedRouter.root
							                            : ""));
							                        utils.Events.fire('app-router-loaded', { body: utils.Misc.sanitizeRouter(savedRouter) }, request.appToken, 
							                        	function(eventError, eventResponse){});

													//add '$_'
													request.addErrorHandlerMiddleware(request.app);
												}
											}
										});
									}
								}
							}

							if (!utils.Misc.isNullOrUndefined(package.bolt.public)) {
								var public = package.bolt.public;
								
								if (public.constructor === Array) { //if (public instanceof Array) //if (Array.isArray(public))
									public.forEach(function(publicPath, index){
										var source = path.join(__node_modulesDir, _path, publicPath);
										var destination = path.join(__publicDir, appnm, publicPath);
										fse.copy(source, destination, { clobber: true }, function(copyError){
											//TODO: what shud I do if there's an error?
										});
									});
								}
								else {
									var destRoot = path.join(__publicDir, appnm);
									var overwrite = true;
									if (!utils.Misc.isNullOrUndefined(public.overwrite)) overwrite = public.overwrite;

									var transferFiles = function() {
										public.paths.forEach(function(publicPath, index){
											var source = path.join(__node_modulesDir, _path, publicPath);
											var destination = path.join(__publicDir, appnm, publicPath);
											if (public.move) {
												fse.move(source, destination, { clobber: overwrite }, function(moveError){
													//TODO: what shud I do if there's an error?
												});
											}
											else {
												fse.copy(source, destination, { clobber: overwrite }, function(copyError){
													//TODO: what shud I do if there's an error?
												});
											}
										});
									}

									if (public.clean){
										fse.emptyDir(destRoot, function(emptyError){
											//TODO: what shud I do if there's an error?
											transferFiles();
										});
									}
									else {
										transferFiles();
									}
								}
							}

							newApp.package = package;

							var saveNewApp = function(){
								newApp.save(function(saveError, savedApp){
									if (!utils.Misc.isNullOrUndefined(saveError)) {
										//TODO: if an error occurs, undo everything this app did
										response.end(utils.Misc.createResponse(null, saveError, 402));
									}
									else {
										savedApp = utils.Misc.sanitizeApp(savedApp);
										/*//necessary info to savedApp.install endpoint
										superagent
											.post(process.env.BOLT_ADDRESS + '/api/apps/start')
											.send({ name: name, install: true })
											.end(function(appstartError, appstartResponse){
												//TODO: when is the right time to shut down the app
												//TODO: I'm thinking we shud encourage them to do it from their 'install' endpoint
											});*/
										utils.Events.fire('app-installed', { body: savedApp }, request.appToken, function(eventError, eventResponse){});
										response.send(utils.Misc.createResponse(savedApp));
									}
								});
							};

							// a module can't check files
							if (!utils.Misc.isNullOrUndefined(package.bolt.checks) && !package.bolt.module) {
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
	postRegPackage: function(request, response){
		if (!utils.Misc.isNullOrUndefined(request.body.path)) {
			var _path = utils.String.trim(request.body.path);
			fs.readFile(path.join(__node_modulesDir, _path, 'package.json'), function (error, data) {
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else {
					var package = JSON.parse(data);

					response.send(utils.Misc.createResponse(package));
				}
			});
		}
		else {
			var error = new Error(errors['410']);
			response.end(utils.Misc.createResponse(null, error, 410));
		}
	},
	postRegReadme: function(request, response){
		if (!utils.Misc.isNullOrUndefined(request.body.path)) {
			var _path = utils.String.trim(request.body.path);
			fs.readFile(path.join(__node_modulesDir, _path, 'readme.md'), function (error, data) {
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else {
					response.send(utils.Misc.createResponse(data.toString('utf8')));
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
				.get(process.env.BOLT_ADDRESS + '/api/apps/' + request.body.name) 
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

					var app = realResponse.body;

					if (app.module) {
						//TODO: throw error(u cant start a module)
					}

					var context = {}
					context.name = app.name;
					context.path = app.path;
					context.app = app;

					var startApp = function() {
						if(!utils.Misc.isNullOrUndefined(app.main)){
							if (app.system) { //if app is system app, mount it as a sub-app
								var subApp = require(path.join(__node_modulesDir, app.path, app.main));
								
								//remove '$_'
								request.removeErrorHandlerMiddleware(request.app);

								request.app.use("/x/" + app.name, subApp);

								//add '$_'
								request.addErrorHandlerMiddleware(request.app);

								//pass info to the app
								var initUrl = app.ini;
								if (true === request.body.install) initUrl = app.install; //if this is called during installation
								if (!utils.Misc.isNullOrUndefined(initUrl)) {
									initUrl = "/" + utils.String.trimStart(initUrl, "/");
									superagent
										.post(process.env.BOLT_ADDRESS + "/x/" + app.name + initUrl)
										.send({ 
											appName: app.name,
											appToken: request.genAppToken(app.name)
										})
										.end(function(initError, initResponse){});
								}

								__runningContexts.push(context);
								utils.Events.fire('app-started', { body: context }, request.appToken, function(eventError, eventResponse){});
								response.send(utils.Misc.createResponse(context));
							}
							else { //if app is NOT a system app, start it on a child process
								context.protocol = process.env.BOLT_PROTOCOL;
								context.host = process.env.BOLT_IP;

								if(!processes.hasProcess(context.name)){
									//pass the context (and a callback) to processes.createProcess()
									//processes.createProcess() will start a new instance of app_process as a child process
									//app_process will send the port it's running on ({child-port}) back to processes.createProcess()
									//processes.createProcess() will send a post request to {host}:{child-port}/start-app, with context as the body
									//{host}:{child-port}/start-app will start app almost as was done before (see __dumps/bolt2.js), on a random port
									//processes will receive the new context (containing port and pid) as the reponse, and send it back in the callback
									processes.createProcess(context, function(error, _context){
										if (!utils.Misc.isNullOrUndefined(error)) {
											response.end(utils.Misc.createResponse(null, error));
										}

										context = _context;

										//pass info to the app
										var initUrl = context.app.ini;
										if (true === request.body.install) initUrl = context.app.install; //if this is called during installation
										if (!utils.Misc.isNullOrUndefined(initUrl)) {
											initUrl = "/" + utils.String.trimStart(initUrl, "/");
											superagent
												.post(process.env.BOLT_PROTOCOL + '://' + process.env.BOLT_IP + ':' + context.port + initUrl)
												.send({ 
													protocol: process.env.BOLT_PROTOCOL, 
													host: process.env.BOLT_IP, 
													port: process.env.PORT || process.env.BOLT_PORT,
													appName: context.name,
													appPort: context.port,
													appToken: request.genAppToken(context.name)
												})
												.end(function(initError, initResponse){});
										}

										__runningContexts.push(context);
										utils.Events.fire('app-started', { body: context }, request.appToken, function(eventError, eventResponse){});
										response.send(utils.Misc.createResponse(context));
									});
								}
								else{
									context.pid = processes.getAppPid(context.name);
									context.port = processes.getAppPort(context.name);
									response.send(utils.Misc.createResponse(context));
								}
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
	postStop: function(request, response){ //TODO: how to stop system apps
		if (!utils.Misc.isNullOrUndefined(request.body.name)) {
			var appnm = utils.String.trim(request.body.name.toLowerCase());
			for (var index = 0; index < __runningContexts.length; index++){
				if (__runningContexts[index].name === appnm){
					//TODO: inform the app you are about to stop it (using a lifecycle-stopping event), if u get an OK from the app go ahead and stop it

					//remove context
					var context = __runningContexts[index];
					__runningContexts.pop(context);

					//remove app token
					request.destroyAppToken(context.name); //TODO: test this

					//kill process
					processes.killProcess(context.name); //TODO: haven't tested this

					utils.Events.fire('app-stopped', { body: context }, request.appToken, function(eventError, eventResponse){});
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
