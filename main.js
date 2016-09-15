var bodyParser = require('body-parser');
var express = require("express");
var fs = require("fs");
var http = require("http");
var path = require("path");

var config = require("./sys/config");
var pacman = require("./sys/packages");
var ports = require("./sys/ports");

//---------Helpers
var __getContextAppInfo = function(data){
	var package = JSON.parse(data);
	var context = {};
	context.appInfo = {
		'name': package.name,
		'version': package.version,
		'description': package.description,
		'main': package.main,
		'jaysos_main': package.jaysos_main,
		'jaysos_icon': package.jaysos_icon,
		'jaysos_init': package.jaysos_init,
		'jaysos_service': package.jaysos_service,
		'jaysos_tags': package.jaysos_tags
	};
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
			if(ports.hasPort(context.path)){
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
		context.id = request.params.app;
		context.path = _path;

		response.send(context);
	});
}

var get_apps_tag = function(request, response){
	var paths = pacman.getTagPaths(request.params.tag);
	if(!paths){}//TODO: what to do what to do

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

			context.host = config.getHost();
			
			//start the server
			var jaysos_main = context.appInfo.jaysos_main;
			if(jaysos_main){
				if(!ports.hasPort(context.path)){
					//var p = ports.makePort(context.path);

					var app = require(path.join(__dirname, 'node_modules', context.path, jaysos_main));
					ports.makePort(context.path, app, function(err, port){
						if(err){
							//TODO: probably cuz there's no available port, send an error response
							//context.error = err.message;
							//response.send(context);
							//return;
							response.status(500).end(err);
						}

						context.port = port;

						//pass the OS host & port to the app
						var initUrl = context.appInfo.jaysos_init;
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

						response.send(context);
					});
				}
				else{
					var p = ports.getPort(context.path);
					context.port = p;
					response.send(context);
				}
			}
			else
				response.send(context);
		});
	});

	req.end();
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
		options.port = ports.getPort(request.body.path); 
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
			if(ports.hasPort(context.path)){
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

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(express.static('sys'));

//redirect to home
app.get('/', function(request, response){
	response.redirect('/home');
});

//runs the app with the specified path  (with the assumption that the server has already been started)
//this is the route that other /app/* routes ultimately call
//this should be used to run only startup OS app(s) that have no external dependencies
//because such dependencies (like .js and .css files) may not be loaded appropriately
app.post('/app', post_app);

//runs the app with the specified id (using default options)
app.get('/app/:app', get_app_app);

//runs the app with the specified path (using options provided in the post body)
app.post('/app/:app', post_app_app);

//gets the app info of the app with the specified id
app.get('/app-info/:app', get_appinfo_app);

//starts the server of the app with the specified id
app.get('/app-start/:app', get_appstart_app);

//TODO: app.get('/app-get/:dev/:app', ...); //installs the app
//TODO: app.post('/app-get/:dev/:app', ...); //updates the app
//TODO: app.del('/app-get/:dev/:app', ...); uninstall the app

//TODO: app.post('/app-id', ...); //sets an id for the app

//TODO: app.get('/app-stop/:id', get_appstop_id); //remember to call port.closePort({...})
//TODO: app.get('/app-stop/:dev/:app', get_appstop_dev_app); //remember to call port.closePort({...})

//TODO: app.get('/apps', get_apps); //gets an array of app-info for all installed apps
//gets an array of app-info for all installed apps with the specified tag
app.get('/apps/:tag', get_apps_tag);

//TODO: app.get('/config', get_config);
//TODO: app.get('/config/:property', get_config_property);

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
	console.log("UI Server listening at http://%s:%s", host, port);

	//TODO: start "system services"
});