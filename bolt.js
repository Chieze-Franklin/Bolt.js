var bodyParser = require('body-parser');
var cons = require('consolidate');
var exec = require('child_process').exec, child;
var express = require("express");
var fs = require("fs");
var http = require("http");
var mongodb = require('mongodb');
var mongoose = require('mongoose'), Schema = mongoose.Schema;
var path = require("path");
var session = require("client-sessions"/*"express-session"*/);
var superagent = require('superagent');

var config = require("./sys/server/config");
var processes = require("./sys/server/processes");

var models = require("./sys/server/models");
var schemata = require("./sys/server/schemata");

var utils = require("./sys/server/utils");

//---------Helpers
var __runningContexts = [];

const X_BOLT_REQ_ID = 'X-Bolt-Req-Id';

var __randomRequestId = [];
var __genRandomRequestId = function(){
	var id = utils.String.getRandomString(24);
	__randomRequestId.push(id);

	//trim the IDs down to 100
	if(__randomRequestId.length > 100)
		__randomRequestId.splice(0, __randomRequestId.length - 100);

	return id;
}
var __isRandomRequestId = function(id){
	var result = (__randomRequestId.indexOf(id) > -1);
	return result;
}

var __getResponse = function(body, error, status){
	var response = {};

	//set status
	if (status) {
		response.status = status;
	}
	else {
		if (body)
			response.status = 200;
		else if (error)
			response.status = 500;
	}

	//set body
	if (body)
		response.body = body;

	//set error
	if (error)
		response.error = error;

	return JSON.stringify(response);
}

var __loadLoginView = function(request, response){
	var scope = {
		protocol: config.getProtocol(),
		host: config.getHost(),
		port: config.getPort(),

		reqid: __genRandomRequestId()
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

		reqid: __genRandomRequestId(),
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
var checkRequestId = function(request, response, next){
	var id = request.get(X_BOLT_REQ_ID);
	if(!id || !__isRandomRequestId(id)) { //this would be true if the request is NOT coming from a native Bolt view
		//TODO: check the app that sent the ID; if NOT one of the apps we are expecting
		var error = new Error("This app has no permission to make this request");
		error.status = 403;
		response.end(__getResponse(null, error, 403)); //TODO: this is one place u need to specify: error_title and error_message
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

//---------Handlers
var get = function(request, response){
	superagent
		.get(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/users') //check if there's any registered user
		.end(function(error, usersResponse){
			if (error) {
				response.end(__getResponse(null, error));
			}
			else {
				var users = usersResponse.body.body; //remember that 'usersResponse.body' is the Bolt response, and a Bolt response usually has a body field
				if(users && users.length > 0){ //if there are registered users,...
					if(request.session && request.session.user){ //a user is logged in, load the home view
						response//.redirect('/home');
					}
					else{ //NO user is logged in, show login view
						//response
						//	.set(X_BOLT_REQ_ID, __genRandomRequestId())
						//	.redirect('/login');
						//my own security features won't let me just navigate to this endpoint, so I to load the view using response.render(...)
						__loadLoginView(request, response);
					}
				}
				else { //if there are NO registered users, then show them the setup view (there's no /setup cuz I dont want ppl typing that)
					//response
					//	.set(X_BOLT_REQ_ID, __genRandomRequestId())
					//	.redirect('/setup');
					//my own security features won't let me just navigate to this endpoint, so I to load the view using response.render(...)

					__loadSetupView(request, response);
				}
			}
		});	
}

var get_app_app = function(request, response){
	superagent
		.post(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/app-start')
		.send({ app: request.params.app })
		.end(function(error, appstartResponse){
			var scope = {
				protocol: config.getProtocol(),
				host: config.getHost(),
				port: config.getPort()
			};

			if (error) {
				//response.end(__getResponse(null, error));
				response.locals.title = "Error";
				response
					.set('Content-type', 'text/html')
					.render('error.html', scope);
			}
			else {
				var context = appstartResponse.body.body;
				//TODO: check appstartResponse.body.error, esp for access denial i.e. appstartResponse.body.status==403 (403.html)

				//load the app
				if (context && context.port) {
					var index = (context.appInfo.index) ? "/" + utils.String.trimStart(context.appInfo.index, "/") : "/";
					response.redirect(config.getProtocol() + '://' + context.host + ':' + context.port + index);
				}
				else {
					//response.send(__getResponse(null, null, 200));
					response.locals.title = "404";
					response
						.set('Content-type', 'text/html')
						.render('404.html', scope);
				}
			}
		});
}

var get_appinfo_app = function(request, response){
	var appnm = utils.String.trim(request.params.app.toLowerCase());
	models.app.findOne({ 
		name: appnm
	}, function(error, app){
		if (error){
			response.end(__getResponse(null, error));
		}
		else if(!app){
			var err = new Error("The app could not be found!");
			err.status = 404;
			response.end(__getResponse(null, err, 404)); //TODO: this is one place u need to specify: error_title and error_message
		}
		else{
			response.send(__getResponse(app));
		}
	});
}

var get_apps_tag = function(request, response){
	var tag = utils.String.trim(request.params.tag.toLowerCase());
	models.app.find({ 
		tags: tag
	}, function(error, apps){
		if (error){
			response.end(__getResponse(null, error));
		}
		else if(!apps){
			var err = new Error("No apps with the tag '" + request.params.tag + "' could not be found!");
			err.status = 404;
			response.end(__getResponse(null, err, 404)); //TODO: this is one place u need to specify: error_title and error_message
		}
		else{
			response.send(__getResponse(apps));
		}
	});
}

var get_file_app_file = function(request, response){
	superagent
		.get(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/file-info/' + request.params.app + '/' + request.params.file)
		.end(function(error, fileinfoResponse){
			if (error) {
				response.end(__getResponse(null, error));
			}
			else {
				var fileInfo = fileinfoResponse.body.body;

				if (fileInfo && fileInfo.fullPath) {
					//response.writeHead(301, {Location: 'file:///' + fileInfo.fullPath});
					//response.end();
					response.redirect(301, 'file:///' + fileInfo.fullPath);
				}
				else {
					var error = new Error("The file '" + request.params.app + '/' + request.params.file + "' could not be found!");
					error.status = 404;
					response.end(__getResponse(null, error, 404));
				}
			}
		});
}

var get_fileinfo_app_file = function(request, response){
	var appnm = utils.String.trim(request.params.app.toLowerCase());
	models.app.findOne({ 
		name: appnm
	}, function(error, app){
		if (error){
			response.end(__getResponse(null, error));
		}
		else if(!app){
			var err = new Error("The app or file could not be found!");
			err.status = 404;
			response.end(__getResponse(null, err, 404)); //TODO: this is one place u need to specify: error_title and error_message
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

			if(fileInfo.path){
				fileInfo.fullPath = path.join(__dirname, 'node_modules', app.path, fileInfo.path);
				fs.stat(fileInfo.fullPath, function(fsError, stats) {
					if (fsError) {
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
				});
			}

			response.send(__getResponse(fileInfo));
		}
	});
}

var get_help = function(request, response){
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

var get_users = function(request, response){
	models.user.find({}, function(error, users){
		if(error){
			response.end(__getResponse(null, error));
		}
		else {
			response.send(__getResponse(users));
		}
	});
}

var get_view = function(request, response){
	//get the app that serves that view; if not get our native view; if not found show app for 404; if not show native 404.html

	var app = null;
	var plug = "/" + utils.String.trimStart(utils.String.trim(request.params.view.toLowerCase()), "/");
	models.plugin.find({ path: plug }, function(errorPlugins, plugins){
		if (errorPlugins){
			response.end(__getResponse(null, errorPlugins));
		}
		//check for an app that can serve this view
		else if(plugins && plugins.length > 0) {
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
				if (!error && stats.isFile()){
					var scope = {
						protocol: config.getProtocol(),
						host: config.getHost(),
						port: config.getPort(),

						title: request.params.view,
						view: request.query.view,
						reqid: __genRandomRequestId()
					};
					response
						.set('Content-type', 'text/html')
						.render(request.params.view + '.html', scope);
				}
				else {
					response.redirect('/404?view=' + request.params.view);
				}
			});
		}
	});
}

var post_appget = function(request, response){
	//expects: { app, version (optional) } => npm install {app}@{version}
	//calls /app-reg after downloading app (if not possible then after package.json and all the files to hash in package.json are downloaded)
}

var post_appreg = function(request, response){
	if(request.body.path){
		var _path = utils.String.trim(request.body.path);
		fs.readFile(path.join(__dirname, 'node_modules', _path, 'package.json'), function (error, data) {
			if(error){
				response.end(__getResponse(null, error));
			}
			else {
				var package = JSON.parse(data);

				if (!package.name) {
					//TODO: error
				}
				var appnm = utils.String.trim(package.name.toLowerCase());
				models.app.findOne({ name: appnm }, function(error, app){
					if (error){
						response.end(__getResponse(null, error));
					}
					else if(!app){
						
						//TODO: copy the bolt client files specified as dependencies into the folders specified; if it fails, stop installation

						var newApp = new models.app({ 
							name: appnm,
							path: _path
						});
						newApp.description = package.description || "";
						newApp.version = package.version || "";

						if (package.bolt.main) newApp.main = package.bolt.main;

						newApp.files = package.bolt.files || {};
						if (package.bolt.icon) newApp.icon = package.bolt.icon;
						if (package.bolt.index) newApp.index = "/" + utils.String.trimStart(package.bolt.index, "/");
						if (package.bolt.ini) newApp.ini = "/" + utils.String.trimStart(package.bolt.ini, "/");
						if (package.bolt.install) newApp.install = "/" + utils.String.trimStart(package.bolt.install, "/");
						newApp.startup = package.bolt.startup || false;
						newApp.tags = package.bolt.tags || [];

						if (package.bolt.plugins) {
							var plugins = package.bolt.plugins;
							for (var plugin in plugins){
								var plug = "/" + utils.String.trimStart(utils.String.trim(plugin.toLowerCase()), "/");
								if (plugins.hasOwnProperty(plugin)){
									var newPlugin = new models.plugin({
										path: plug,
										app: appnm,
										endpoint: plugins[plugin]
									});
									newPlugin.save(); //TDOD: how to check that two plugins dont hv d same path and app
								}
							}
						}

						//TODO: appHash

						newApp.package = package;

						newApp.save();
						response.send(__getResponse(newApp));
					}
					else{
						var err = new Error("An app with the same name already exists!");
						err.status = 400;
						response.end(__getResponse(null, err, 400)); //TODO: this is one place u need to specify: error_title and error_message
					}
				});
			}
		});
	}
	else {
		var error = new Error("App path missing!");
		error.status = 400;
		response.end(__getResponse(null, error, 400)); //TODO: this is one place u need to specify: error_title and error_message
	}
}

var post_appstart = function(request, response){
	var appnm = utils.String.trim(request.body.app.toLowerCase());
	for (var index = 0; index < __runningContexts.length; index++){
		if (__runningContexts[index].name === appnm){
			response.send(__getResponse(__runningContexts[index]));
			return;
		}
	}

	superagent
		.get(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/app-info/' + request.body.app) 
		.end(function(appinfoError, appinfoResponse){
			if (appinfoError) {
				response.end(__getResponse(null, appinfoError));
				return;
			}

			var context = {}
			var app = appinfoResponse.body.body;

			context.name = app.name;
			context.path = app.path;
			context.appInfo = app;

			//start a child process for the app
			if(context.appInfo.main){
				context.host = config.getHost();

				if(!processes.hasProcess(context.name)){
					//pass the context (and a callback) to processes.createProcess()
					//processes.createProcess() will start a new instance of app_process as a child process
					//app_process will send the port it's running on ({child-port}) back to processes.createProcess()
					//processes.createProcess() will send a post request to {host}:{child-port}/start-app, with context as the body
					//{host}:{child-port}/start-app will start app almost as was done before (see __raw/bolt2.js), on a random port
					//processes will receive the new context (containing port and pid) as the reponse, and send it back in the callback
					processes.createProcess(context, function(error, _context){
						if(error){
							response.end(__getResponse(null, error));
						}

						context = _context;

						//pass the OS host & port to the app
						var initUrl = context.appInfo.ini;
						if(initUrl){
							superagent
								.post(config.getProtocol() + '://' + config.getHost() + ':' + context.port + initUrl)
								.send({ host: config.getHost(), port: config.getPort() }) //TODO: pass secret here
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
		});
}

var post_appstop = function(request, response){
	var appnm = utils.String.trim(request.body.app.toLowerCase());
	for (var index = 0; index < __runningContexts.length; index++){
		if (__runningContexts[index].name === appnm){
			//remove context
			var context = __runningContexts[index];
			__runningContexts.pop(context);

			//kill process
			processes.killProcess(context.name); //TODO: haven't tested this

			response.send(__getResponse(context));
			return;
		}
	}

	//if it gets here then the context wasn't found
	var error = new Error("The app '" + request.body.app + "' could not be found to be running!");
	error.status = 404;
	response.end(__getResponse(null, error, 404));
}

var post_role_add = function(request, response){
	if(request.body.name){
		models.role.findOne({ name: request.body.name }, function(error, role){
			if (error){
				response.end(__getResponse(null, error));
			}
			else if(!role){
				var newRole = new models.role({ name: request.body.name });
				if(request.body.isAdmin){
					newRole.isAdmin = request.body.isAdmin;
				}
				if(request.body.description){
					newRole.description = request.body.description;
				}
				newRole.save();
				response.send(__getResponse(newRole));
			}
			else{
				var err = new Error("A role with the same name already exists!");
				err.status = 400;
				response.end(__getResponse(null, err, 400)); //TODO: this is one place u need to specify: error_title and error_message
			}
		});
	}
	else {
		var error = new Error("Role name missing!");
		error.status = 400;
		response.end(__getResponse(null, error, 400)); //TODO: this is one place u need to specify: error_title and error_message
	}
}

var post_user_add = function(request, response){
	if(request.body.username && request.body.password){
		var usrnm = utils.String.trim(request.body.username.toLowerCase());
		models.user.findOne({ username: usrnm }, function(error, user){
			if (error){
				response.end(__getResponse(null, error));
			}
			else if(!user){
				var newUser = new models.user({ 
					username: usrnm, 
					passwordHash: utils.Security.hashSync(request.body.password + usrnm)
				});
				newUser.save();
				delete newUser.passwordHash;
				response.send(__getResponse(newUser));
			}
			else{
				var err = new Error("A user with the same username already exists!");
				err.status = 400;
				response.end(__getResponse(null, err, 400)); //TODO: this is one place u need to specify: error_title and error_message
			}
		});
	}
	else {
		var error = new Error("Username and/or password missing!");
		error.status = 400;
		response.end(__getResponse(null, error, 400)); //TODO: this is one place u need to specify: error_title and error_message
	}
}

var post_user_login = function(request, response){
	if(request.body.username && request.body.password){
		var usrnm = utils.String.trim(request.body.username.toLowerCase());
		models.user.findOne({ 
			username: usrnm, 
			passwordHash: utils.Security.hashSync(request.body.password + usrnm) 
		}, function(error, user){
			if (error){
				response.end(__getResponse(null, error));
			}
			else if(!user){
				request.session.reset();
				var err = new Error("The user could not be found!");
				err.status = 404;
				response.end(__getResponse(null, err, 404)); //TODO: this is one place u need to specify: error_title and error_message
			}
			else{
				user.visits+=1;
				user.save();
				delete user.passwordHash;
				request.session.user = user;
				response.locals.user = user;
				response.send(__getResponse(user));
			}
		});
	}
	else {
		var error = new Error("Username and/or password missing!");
		error.status = 400;
		response.end(__getResponse(null, error, 400)); //TODO: this is one place u need to specify: error_title and error_message
	}
}

var post_user_logout = function(request, response){
	request.session.reset();
  	response.end(__getResponse(null, null, 200));
}

var post_userrole_add = function(request, response){
	if(request.body.user && request.body.role){
		var usrnm = utils.String.trim(request.body.user.toLowerCase());
		models.user.findOne({ username: usrnm }, function(errorUser, user){
			if (errorUser){
				response.end(__getResponse(null, errorUser));
			}
			else if(!user){
				request.session.reset();
				var errUser = new Error("The user could not be found!");
				errUser.status = 404;
				response.end(__getResponse(null, errUser, 404)); //TODO: this is one place u need to specify: error_title and error_message
			}
			else{
				models.role.findOne({ name: request.body.role }, function(errorRole, role){
					if (errorRole){
						response.end(__getResponse(null, errorRole));
					}
					else if(!role){
						request.session.reset();
						var errRole = new Error("The role could not be found!");
						errRole.status = 404;
						response.end(__getResponse(null, errRole, 404)); //TODO: this is one place u need to specify: error_title and error_message
					}
					else{
						var newUserRoleAssoc = new models.userRoleAssoc({ 
							role: role.name,
							role_id: role._id, 
							user: user.username,
							user_id: user._id 
						});
						newUserRoleAssoc.save();
						response.send(__getResponse(newUserRoleAssoc));
					}
				});
			}
		});
	}
	else {
		var error = new Error("Username and/or password missing!");
		error.status = 400;
		response.end(__getResponse(null, error, 400)); //TODO: this is one place u need to specify: error_title and error_message
	}
}

var setContentToCss = function(request, response, next) {
	response.set('Content-Type', 'text/css');
  	next();
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

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function (request, response, next) {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  response.set('Content-Type', 'application/json');
  next();
});
app.use(session({
	cookieName: 'session',
	secret: config.getSessionSecret(),
	duration: 24 * 60 * 60 * 1000,
	activeDuration: 24 * 60 * 60 * 1000

	/*saveUninitialized: true, 	//for express-session
	resave: true*/				//for express-session
}));
app.use(function(request, response, next) {
	if (request.session && request.session.user) {
		models.user.findOne({ username: request.session.user.username }, function(error, user) {
			if (user) {
				delete user.passwordHash; // delete the password from the session
				request.user = user;
				request.session.user = user;  //refresh the session value
				response.locals.user = user;  //make available to UI template engines
			}
			next();
		});
	} 
	else {
		next();
	}
});

app.use('/assets/plugins/*/*css', setContentToCss);
app.use('/pages/css', setContentToCss);

app.use('/assets', express.static(__dirname + '/sys/views/assets'));
app.use('/pages', express.static(__dirname + '/sys/views/pages'));
app.use('/client', express.static(__dirname + '/sys/client'));

app.set('views', __dirname + '/sys/views');
app.engine('html', cons.handlebars);
app.set('view engine', 'html');

//this UI endpoint displays the appropriate view per time
app.get('/', get);

//this UI endpoint runs the app with the specified name (using default options)
app.get('/app/:app', get_app_app);

//installs an app from an online repository (current only npm is supported)
app.post('/app-get', checkAppUserPermToInstall, checkUserAdminRight, post_appget);
//TODO: /app-reget (update) /app-unget (uninstall)

//gets the app info of the app with the specified name
app.get('/app-info/:app', get_appinfo_app);

//installs an app from an local repository (current only the node_modules folder is supported)
app.post('/app-reg', checkAppUserPermToInstall, checkUserAdminRight, post_appreg);
//TODO: /app-rereg (update) /app-unreg (uninstall)

//starts the server of the app with the specified name
app.post('/app-start', checkUserAppRight, post_appstart);

//TODO: /app-role/add //adds an app-role association
//TODO: /app-role/del 

//stops the server of the app with the specified name
app.post('/app-stop', checkUserAppRight, post_appstop);

//TODO: app.get('/apps', get_apps); //gets an array of app-info for all installed apps
//gets an array of app-info for all installed apps with the specified tag
app.get('/apps/:tag', get_apps_tag);
//TODO: app.get('/apps/:tag/:app', get_apps_tag_app); //sets app as the default app for the tag (an ex of a call dt requires user permission)

//TODO: app.get('/config', get_config);
//TODO: app.get('/config/:property', get_config_property);

//TODO: app.get('/file/:file') //runs a file that can be served by any app
//runs the file with the specified name (using default options)
//ISSUE: does not work properly because browsers seem to block it
app.get('/file/:app/:file', get_file_app_file);

//TODO: app.get('/file-info/:file') //gets the file info of a file that can be served by any app
//gets the file info of the file with the specified name
app.get('/file-info/:app/:file', checkUserAppFileRight, get_fileinfo_app_file);

//returns an array of all endpoints, and some extra info
app.get('/help', get_help);
//TODO: app.get('/help/:endpoint', get_help_endpoint); //returns the description of an endpoint
//TODO: app.get('/help/:endpoint/:version', get_help_endpoint_version); //returns the description of a version of an endpoint

//creates a new role
app.post('/role/add', checkRequestId, post_role_add);

//TODO: /role/del

//TODO: app.get('/running-apps', get_runningapps); //gets an array of all running apps consider: /live-apps, /apps-running

//gets the current user
//TODO: app.get('/user', post_userd);

//adds a user to the database
app.post('/user/add', checkRequestId, post_user_add);

//TODO: /user/del

//logs a user into the system
app.post('/user/login', checkRequestId, post_user_login);

//logs a user out of the system
app.post('/user/logout', checkRequestId, post_user_logout);

//adds a user-role associate to the database
app.post('/user-role/add', checkRequestId, post_userrole_add);

//TODO: /user-role/del

//returns an array of all registered users.
app.get('/users', get_users);

//returns an array of all live (currently-logged-in) users
//TODO: app.get('/users/live', get_users_live);

//---------------views
//this UI endpoint displays the login view
app.get('/login', checkRequestId, get_login);

//this UI endpoint displays the logout view
app.get('/logout', get_logout);

//this UI endpoint displays the setup view
app.get('/setup', checkRequestId, get_setup);

//this UI endpoint displays the specified view
app.get('/:view', get_view);

// catch 404 and forward to error handler
app.use(function(request, response, next) {
  var error = new Error("The endpoint '" + request.path + "' could not be found!");
  error.status = 404;
  //response.end(__getResponse(null, error, 404));
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
									return;
								}
								
								var name = startups[index];
								superagent
									.post(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/app-start')
									.send({ app: name })
									.end(function(appstartError, appstartResponse){
										if (appstartError) {
											runStartups(++index);
											return;
										}

										var context = appstartResponse.body.body;

										if (context && context.port) {
											console.log("Started startup app%s%s at %s:%s",
												(context.name ? " '" + context.name + "'" : ""), (context.path ? " (" + context.path + ")" : ""),
												(context.host ? context.host : ""), context.port);
										}
										runStartups(++index);
									});
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