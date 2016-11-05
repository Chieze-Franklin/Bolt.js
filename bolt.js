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
var pacman = require("./sys/server/packages");
var processes = require("./sys/server/processes");

var models = require("./sys/server/models");
var schemata = require("./sys/server/schemata");

var utils = require("./sys/server/utils");

//---------Helpers
var __pathToContextMap = new Map();

var __getContextAppInfo = function(data){
	var package = JSON.parse(data);
	var context = {};
	context.appInfo = {
		name: package.name,
		version: package.version,
		description: package.description,
		main: package.main,
		bolt: package.bolt
	};
	return context;
}

var __getContextFileInfo = function(data, name){
	var package = JSON.parse(data);
	var context = {};
	if (package.bolt && package.bolt.files) {
		for (var i = 0; i < package.bolt.files.length; i++) {
			var entry = package.bolt.files[i]
			if(entry.name === name){
				context.fileInfo = {
					name: entry.name,
					path: entry.path
				};
				break;
			}
		}
	}
	return context;
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

	return response;
}

//---------Request Validators
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

			var scope = {
				protocol: config.getProtocol(),
				host: config.getHost(),
				port: config.getPort()
			};
			var users = usersResponse.body.body; //remember that 'usersResponse.body' is the Bolt response, and a Bolt response usually has a body field
			console.log("confirm:");
			console.log(users);
			if(users && users.length > 0){ //if there are registered users,...
				if(request.session && request.session.user){ //a user is logged in, load index (welcome) page
					response
						.set('Content-type', 'text/html')
						.render('index.html', scope);
				}
				else{ //NO user is logged in, show login view
					response
						.set('Content-type', 'text/html')
						.render('login.html', scope);
				}
			}
			else { //if there are NO registered users, then show them the setup view
				response
					.set('Content-type', 'text/html')
					.render('setup.html', scope);
			}
		});	
}

var get_app_app = function(request, response){
	superagent
		.post(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/app-start/' + request.params.app)
		.end(function(error, appstartResponse){
			if (error) {
				response.end(__getResponse(null, error));
			}

			var context = appstartResponse.body.body;

			//run the app
			if (context && context.port) {
				var index = (context.appInfo.bolt.index) ? context.appInfo.bolt.index : "/"; //TODO: trim-start '/' off context.appInfo.bolt.index
				response.redirect(config.getProtocol() + '://' + context.host + ':' + context.port + index);
			}
			else {
				response.send(__getResponse(null, null, 200));
			}
		});
}

var get_appinfo_app = function(request, response){
	var _path = pacman.getAppPath(request.params.app);
	if(!_path){
		_path = request.params.app;
	}
	fs.readFile(path.join(__dirname, 'node_modules', _path, 'package.json'), function (error, data) {
		if(error){
			response.end(__getResponse(null, error));
		}
		
		var package = JSON.parse(data);
		var context = __getContextAppInfo(data);
		context.name = request.params.app;
		context.path = _path;

		response.send(__getResponse(context));
	});
}

var get_apps_tag = function(request, response){
	var paths = pacman.getTagPaths(request.params.tag);
	if(!paths){
		var error = new Error("The tag '" + request.params.tag + "' could not be found!");
		error.status = 404;
		response.end(__getResponse(null, error, 404));
	}

	var contexts = [];
	paths.forEach(function(_path, index){
		var resolvedPath = pacman.getAppPath(_path);
		if(!resolvedPath){
			resolvedPath = _path;
		}
		var data = fs.readFileSync(path.join(__dirname, 'node_modules', resolvedPath, 'package.json'));
		var package = JSON.parse(data);
		var context = __getContextAppInfo(data);
		context.path = resolvedPath;

		contexts.push(context);
	});
	response.send(__getResponse(contexts));
}

var get_file_app_file = function(request, response){
	superagent
		.get(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/file-info/' + request.params.app + '/' + request.params.file)
		.end(function(error, fileinfoResponse){
			if (error) {
				response.end(__getResponse(null, error));
			}

			var context = fileinfoResponse.body.body;

			if (context.fileInfo && context.fileInfo.fullPath) {
				//response.writeHead(301, {Location: 'file:///' + context.fileInfo.fullPath});
				//response.end();
				response.redirect(301, 'file:///' + context.fileInfo.fullPath);
			}
			else {
				var error = new Error("The file '" + request.params.app + '/' + request.params.file + "' could not be found!");
				error.status = 404;
				response.end(__getResponse(null, error, 404));
			}
		});
}

var get_fileinfo_app_file = function(request, response){
	var _path = pacman.getAppPath(request.params.app);
	if(!_path){
		_path = request.params.app;
	}
	fs.readFile(path.join(__dirname, 'node_modules', _path, 'package.json'), function (error, data) {
		if(error){
			response.end(__getResponse(null, error));
		}
		
		var package = JSON.parse(data);
		var context = __getContextFileInfo(data, request.params.file);
		if(context.fileInfo.path)
			context.fileInfo.fullPath = path.join(__dirname, 'node_modules', _path, context.fileInfo.path);
		context.name = request.params.app;
		context.path = _path;

		response.send(__getResponse(context));
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

var get_users = function(request, response){
	models.user.find({}, function(error, users){
		if(error){
			response.end(__getResponse(null, error));
		}
		response.send(__getResponse(users));
	});
}

var post_appstart_app = function(request, response){
	var _path = pacman.getAppPath(request.params.app);
	if(!_path){
		_path = request.params.app;
	}
	if(__pathToContextMap.has(_path)){
		response.send(__getResponse(__pathToContextMap.get(_path)));
		return;
	}

	superagent
		.get(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/app-info/' + request.params.app) 
		.end(function(appinfoError, appinfoResponse){
			if (appinfoError) {
				response.end(__getResponse(null, appinfoError));
			}

			var context = appinfoResponse.body.body;

			//start a child process for the app
			if(context.appInfo.bolt.main){
				context.host = config.getHost();

				if(!processes.hasProcess(context.path)){
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
						var initUrl = context.appInfo.bolt.init;
						if(initUrl){
							superagent
								.get(config.getProtocol() + '://' + config.getHost() + ':' + context.port + initUrl + '?host=' + config.getHost() + '&port=' + config.getPort())
								.end(function(initError, initResponse){});
						}

						__pathToContextMap.set(context.path, context);
						response.send(__getResponse(context));
					});
				}
				else{
					context.pid = processes.getAppPid(context.path);
					context.port = processes.getAppPort(context.path);
					response.send(__getResponse(context));
				}
			}
			else
				response.send(__getResponse(context));
		});
}

var post_appstop_app = function(request, response){
	var _path = pacman.getAppPath(request.params.app);
	if(!_path){
		_path = request.params.app;
	}

	if(!__pathToContextMap.has(_path)){
		var error = new Error("The app '" + request.params.tag + "' could not be found to be running!");
		error.status = 404;
		response.end(__getResponse(null, error, 404));
	}

	//remove context
	var context = __pathToContextMap.get(_path);
	__pathToContextMap.delete(_path);

	//kill process
	processes.killProcess(_path); //TODO: haven't tested this

	response.send(__getResponse(context));
}

var post_user_add = function(request, response){
	//TODO: ID the request
	if(request.body.username && request.body.password){
		var usrnm = utils.String.trim(request.body.username.toLowerCase());
		var newUser = new models.user({ 
			username: usrnm, 
			passwordHash: utils.Security.hashSync(request.body.password + usrnm)
		});
		newUser.save();
		delete newUser.passwordHash;
		response.send(__getResponse(newUser));
	}
	else {
		var error = new Error("Username and/or password missing!");
		error.status = 400;
		response.end(__getResponse(null, error, 400)); //TODO: this is one place u need to specify: error_title and error_message
	}
}

var post_user_login = function(request, response){
	//TODO: ID the request
	if(request.body.username && request.body.password){
		var usrnm = utils.String.trim(request.body.username.toLowerCase());
		models.user.findOne({ 
			username: usrnm, 
			passwordHash: utils.Security.hashSync(request.body.password + usrnm) 
		}, function(error, user){
			if(error){
				response.end(__getResponse(null, error));
			}

			if(!user){
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
	//TODO: ID the request
	request.session.reset();
  	response.end(__getResponse(null, null, 200));
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

app.use('/assets', express.static(__dirname + '/sys/assets'));
app.use('/client', express.static(__dirname + '/sys/client'));

app.set('views', __dirname + '/sys/views');
app.engine('html', cons.handlebars);
app.set('view engine', 'html');

//this UI endpoint displays the appropriate view per time
app.get('/', get);

//this UI endpoint runs the app with the specified name (using default options)
app.get('/app/:app', get_app_app);

//gets the app info of the app with the specified name
app.get('/app-info/:app', checkUserAppRight, get_appinfo_app);

//starts the server of the app with the specified name
app.post('/app-start/:app', post_appstart_app);

//TODO: app.get('/app-get/:dev/:app', ...); //installs the app
//TODO: app.post('/app-get/:dev/:app', ...); //updates the app
/*
during install and update, copy the bolt client files specified as dependencies into the folders specified
*/
//TODO: app.del('/app-get/:dev/:app', ...); uninstall the app

//TODO: app.post('/app-id', ...); //sets an id for the app

//stops the server of the app with the specified name
app.post('/app-stop/:app', post_appstop_app);

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
app.get('/file-info/:app/:file', checkUserAppRight, checkUserAppFileRight, get_fileinfo_app_file);

//returns an array of all endpoints, and some extra info
app.get('/help', get_help);
//TODO: app.get('/help/:endpoint', get_help_endpoint); //returns the description of an endpoint
//TODO: app.get('/help/:endpoint/:version', get_help_endpoint_version); //returns the description of a version of an endpoint

//TODO: app.get('/running-apps', get_runningapps);

//TODO: app.get('/running-apps', get_runningapps); //gets an array of all running apps consider: /live-apps, /apps-running

//gets the current user
//TODO: app.get('/user', post_userd);

//adds a user to the database
app.post('/user/add', post_user_add);

app.post('/user/login', post_user_login);

app.post('/user/logout', post_user_logout);

//returns an array of all registered users.
app.get('/users', get_users);

//returns an array of all live (currently-logged-in) users
//TODO: app.get('/users/live', get_users_live);

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

	//start start-up services
	var startups = pacman.getStartupAppNames();
	var runStartups = function(index){
		if(index >= startups.length){
			return;
		}
		else if(index === -1){
			mongoose.connect('mongodb://localhost:' + config.getDbPort() + '/bolt');

			/*mongodb.MongoClient.connect('mongodb://localhost:401/bolt', function(err, db) {
				runStartups(++index);
			});*/
			mongoose.connection.on('open', function(){
				runStartups(++index);
			});
		}
		else{
			var name = startups[index];
			superagent
				.post(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/app-start/' + name)
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
	}

	//start mongodb 
	if (process.platform === 'win32'){
		var mongodbPath = path.join(__dirname, 'sys/bins/mongodb-win64/mongod.exe');
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
					runStartups(-1);
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