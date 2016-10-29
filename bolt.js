var bodyParser = require('body-parser');
var cons = require('consolidate');
var express = require("express");
var fs = require("fs");
var http = require("http");
var path = require("path");

var config = require("./sys/server/config");
var pacman = require("./sys/server/packages");
var processes = require("./sys/server/processes");

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
		bolt_main: package.bolt_main,
		bolt_icon: package.bolt_icon,
		bolt_index: package.bolt_index,
		bolt_init: package.bolt_init,
		bolt_startup: package.bolt_startup,
		bolt_tags: package.bolt_tags
	};
	return context;
}

var __getContextResInfo = function(data, name){
	var package = JSON.parse(data);
	var context = {};
	for (var i = 0; i < package.bolt_resources.length; i++) {
		var entry = package.bolt_resources[i]
		if(entry.name === name){
			context.resInfo = {
				name: entry.name,
				path: entry.path
			};
			break;
		}
	}
	return context;
}

//---------Handlers
var get_app_app = function(request, response){
	var options = {
		method: 'get',
		host: config.getHost(),
		port: config.getPort(),
		path: '/app-start/' + request.params.app
	};

	var req = http.request(options, function(res){
		var body = '';
		res.on('data', function(data) {
			body += data;
		});
		res.on('end', function() {
			var context = JSON.parse(body);

			//run the app
			if(context.port){
				var postBody = {
					method: 'get',
					host: context.host,
					port: context.port,
					path: context.path,
					route: '/'
				};
				var opt = {
					method: 'post',
					host: config.getHost(),
					port: config.getPort(),
					path: "/app",
					headers: {
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(JSON.stringify(postBody))
					}
				};
				var rq = http.request(opt, function(rs){
					var bdy = '';
					rs.on('data', function(d) {
						bdy += d;
					});
					rs.on('end', function() {
						
						response.send(bdy);
					});
				});

				rq.write(JSON.stringify(postBody));
				rq.end();
			}
			else
				response.send();
		});
	});

	req.end();
}

var get_appinfo_app = function(request, response){
	var _path = pacman.getAppPath(request.params.app);
	if(!_path){
		_path = request.params.app;
	}
	fs.readFile(path.join(__dirname, 'node_modules', _path, 'package.json'), function (err, data) {
		if(err){
			response.status(404).end(err);
		}
		
		var package = JSON.parse(data);
		var context = __getContextAppInfo(data);
		context.name = request.params.app;
		context.path = _path;

		response.send(context);
	});
}

var get_apps_tag = function(request, response){
	var paths = pacman.getTagPaths(request.params.tag);
	if(!paths){
		response.status(404).end();
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
	response.send(contexts);
}

var get_appstart_app = function(request, response){
	var _path = pacman.getAppPath(request.params.app);
	if(!_path){
		_path = request.params.app;
	}
	if(__pathToContextMap.has(_path)){
		response.send(__pathToContextMap.get(_path));
		return;
	}

	var options = {
		method: 'get',
		host: config.getHost(),
		port: config.getPort(),
		path: '/app-info/' + request.params.app
	};

	var req = http.request(options, function(res){
		var body = '';
		res.on('data', function(data) {
			body += data;
		});
		res.on('end', function() {
			var context = JSON.parse(body);
			
			//start a child process for the app
			if(context.appInfo.bolt_main){
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
							response.status(500).end(error);
						}

						context = _context;

						//pass the OS host & port to the app
						var initUrl = context.appInfo.bolt_init;
						if(initUrl){
							var opt = {
								method: 'get',
								host: config.getHost(),
								port: context.port,
								path: initUrl + '?host=' + config.getHost() + '&port=' + config.getPort()
							};
							var rq = http.request(opt, function(rs){
								var bdy = '';
								rs.on('data', function(d) {
									bdy += d;
								});
								rs.on('end', function() {
									//
								});
							});
							rq.end();
						}

						__pathToContextMap.set(context.path, context);
						response.send(context);
					});
				}
				else{
					context.pid = processes.getAppPid(context.path);
					context.port = processes.getAppPort(context.path);
					response.send(context);
				}
			}
			else
				response.send(context);
		});
	});

	req.end();
}

var get_appstop_app = function(request, response){
	var _path = pacman.getAppPath(request.params.app);
	if(!_path){
		_path = request.params.app;
	}

	if(!__pathToContextMap.has(_path)){
		response.status(404).end();
	}

	//remove context
	var context = __pathToContextMap.get(_path);
	__pathToContextMap.delete(_path);

	//kill process
	processes.killProcess(_path); //TODO: not working well

	response.send(context);
}

var get_help = function(request, response){
	//response.send(app._router.stack); //run this (comment everything below) to see the structure of 'app._router.stack'

	//TODO: consider making it possible to know the state of an endpoint: deprecated, stable, internal, unstable

	var system = {
		name: "Bolt.js",
		friendly_name: "Bolt Runtime Environment",
		version: "0.0.1",
		friendly_version: "2016"
	};
	var routes = [];
	var paths = [];
	app._router.stack.forEach(function(r){
		if(r.route && r.route.path){
			var entry = {};
			var entry_summary = "";
			if(r.route.stack){
				r.route.stack.forEach(function(s){
					if(s.method){
						entry.method = s.method;
						entry_summary += s.method + ": ";
					}
					entry.path = r.route.path;
					entry_summary += r.route.path;

					routes.push(entry);
					paths.push(entry_summary);
				});
			}
		}
	});

	system.paths = paths;
	system.routes = routes;

	response.send(system);
}

var get_res_app_view = function(request, response){
	var options = {
		method: 'get',
		host: config.getHost(),
		port: config.getPort(),
		path: '/res-info/' + request.params.app + '/' + request.params.res
	};

	var req = http.request(options, function(res){
		var body = '';
		res.on('data', function(data) {
			body += data;
		});
		res.on('end', function() {
			var context = JSON.parse(body);

			if(context.resInfo.full_path){
				response.writeHead(302, {Location: 'file:///' + context.resInfo.full_path});
				response.end();
			}
			else{
				response.status(404).end("no resource found");
			}
		});
	});

	req.end();
}

var get_resinfo_app_view = function(request, response){
	var _path = pacman.getAppPath(request.params.app);
	if(!_path){
		_path = request.params.app;
	}
	fs.readFile(path.join(__dirname, 'node_modules', _path, 'package.json'), function (err, data) {
		if(err){
			response.status(404).end(err);
		}
		
		var package = JSON.parse(data);
		var context = __getContextResInfo(data, request.params.res);
		if(context.resInfo.path)
			context.resInfo.full_path = path.join(__dirname, 'node_modules', _path, context.resInfo.path);
		context.name = request.params.app;
		context.path = _path;

		response.send(context);
	});
}

var get_short = function(request, response){
	var _path = pacman.getFullPath(request.params.short);
	if(!_path){
		response.status(404).end();
	}

	//trim-start '/'
	for(i = 0; _path.charAt(i) == '/' && i < _path.length; )
		_path = _path.substring(i + 1);

	var options = {
		method: 'get',
		host: config.getHost(),
		port: config.getPort(),
		path: '/' + _path
	};

	var req = http.request(options, function(res){
		var body = '';
		res.on('data', function(data) {
			body += data;
		});
		res.on('end', function() {
			var result = JSON.parse(body);
			
			response.send(result);
		});
	});

	req.end();
}

var post_app = function(request, response){
	var options = {
		method: request.body.method,
		host: request.body.host,
		port: request.body.port,
		path: request.body.route
	};
	//don't be confused, the route of the body will be the path of our request options
	//the path of the body represents the app, and we can use it to get the port
	if(!options.port){
		options.port = processes.getAppPort(request.body.path); 
		//options.port may still be undefined/null, esp. if u called this function without starting the server for the app
		//or if there's no available port
		if(!options.port){
			response.status(500).end("no port found");//TODO: better msg
		}
	}

	var req = http.request(options, function(res){
		var bdy = '';
		res.on('data', function(d) {
			bdy += d;
		});
		res.on('end', function() {
			
			response.send(bdy);
		});
	});

	req.end();
}

var post_app_app = function(request, response){
	var options = {
		method: 'get',
		host: config.getHost(),
		port: config.getPort(),
		path: '/app-start/' + request.params.app
	};

	var req = http.request(options, function(res){
		var body = '';
		res.on('data', function(data) {
			body += data;
		});
		res.on('end', function() {
			var context = JSON.parse(body);

			//run the app
			if(processes.hasProcess(context.path)){
				var postBody = request.body;
				var opt = {
					method: 'post',
					host: config.getHost(),
					port: config.getPort(),
					path: "/app",
					headers: {
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(JSON.stringify(postBody))
					}
				};
				var rq = http.request(opt, function(rs){
					var bdy = '';
					rs.on('data', function(d) {
						bdy += d;
					});
					rs.on('end', function() {
						
						response.send(bdy);
					});
				});

				rq.write(JSON.stringify(postBody));
				rq.end();
			}
			else
				response.send();
		});
	});

	req.end();
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
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  res.set('Content-Type', 'application/json');
  next();
});

app.use('/assets', express.static(__dirname + '/sys/assets'));
app.use('/client', express.static(__dirname + '/sys/client'));

app.set('views', __dirname + '/sys/views');
app.engine('html', cons.handlebars);
app.set('view engine', 'html');
//redirect to home
app.get('/', function(request, response){
	//response.redirect('/home');
	response.status(200);
	response.set('Content-type', 'text/html');
	response.render('index.html', {
		protocol: "http",
		host: config.getHost(),
		port: config.getPort()
	});
});

//runs the app with the specified info in the body of the post  (with the assumption that the server has already been started)
//this is the route that other /app/* routes ultimately call
//this should be used to run only startup OS app(s) that have no external dependencies
//because such dependencies (like .js and .css files) may not be loaded appropriately
app.post('/app', post_app);

//runs the app with the specified name (using default options)
app.get('/app/:app', get_app_app);

//runs the app with the specified info in the body of the post
app.post('/app/:app', post_app_app);

//gets the app info of the app with the specified name
app.get('/app-info/:app', get_appinfo_app);

//starts the server of the app with the specified name
app.get('/app-start/:app', get_appstart_app);

//TODO: app.get('/app-get/:dev/:app', ...); //installs the app
//TODO: app.post('/app-get/:dev/:app', ...); //updates the app
/*
during install and update, copy the bolt client files specified as dependencies into the folders specified
*/
//TODO: app.del('/app-get/:dev/:app', ...); uninstall the app

//TODO: app.post('/app-id', ...); //sets an id for the app

//stops the server of the app with the specified name
app.get('/app-stop/:app', get_appstop_app);

//TODO: app.get('/apps', get_apps); //gets an array of app-info for all installed apps
//gets an array of app-info for all installed apps with the specified tag
app.get('/apps/:tag', get_apps_tag);
//TODO: app.get('/apps/:tag/:app', get_apps_tag_app); //sets app as the default app for the tag (an ex of a call dt requires user permission)

//TODO: app.get('/config', get_config);
//TODO: app.get('/config/:property', get_config_property);

//returns an array of all endpoints
app.get('/help', get_help);
//TODO: app.get('/help/:endpoint', get_help_endpoint); //returns the description of an endpoint
//TODO: app.get('/help/:endpoint/:version', get_help_endpoint_version); //returns the description of a version of an endpoint

//TODO: app.get('/running-apps', get_runningapps); //gets an array of all running apps consider: /live-apps, /apps-running

//runs the resource with the specified name (using default options)
//TODO: unstable, and may be removed
app.get('/res/:app/:res', get_res_app_view);

//gets the resource info of the resource with the specified name
app.get('/res-info/:app/:res', get_resinfo_app_view);

//executes a shortcut command
app.get('/:short', get_short);
//TODO: app.post('/:short', ...); //here u can specify METHOD and other options

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/*app.configure(function(){
	app.use(function(err, req, res, next) {
	  console.log(err.message);
	  console.log(err);
	});
})*/

var server = app.listen(config.getPort(), config.getHost(), function(){
	var host = server.address().address;
	var port = server.address().port;
	console.log("Bolt Server listening at http://%s:%s", host, port);

	//listen for 'uncaughtException' so it doesnt crash our system
	process.on('uncaughtException', function(error){
		console.log(error.code);
	});

	//start start-up services
	var startups = pacman.getStartupAppNames();
	var runStartup = function(index){
		if(index >= startups.length){
			return;
		}

		var name = startups[index];
		var options = {
			method: 'get',
			host: config.getHost(),
			port: config.getPort(),
			path: '/app-start/' + name
		};
		
		var req = http.request(options, function(res){
			var body = '';
			res.on('data', function(data) {
				body += data;
			});
			res.on('end', function() {
				var context = JSON.parse(body);
				if(context.port){
					console.log("Started startup app%s%s at %s:%s",
						(context.name ? " '" + context.name + "'" : ""), (context.path ? " (" + context.path + ")" : ""),
						(context.host ? context.host : ""), context.port);
				}
				runStartup(++index);
			});
		});
		req.end();
	}
	runStartup(0);
});