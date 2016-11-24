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
var utils = require("./sys/server/utils");

var apiRouter = require('./sys/server/routers/api');
var apiAppRolesRouter = require('./sys/server/routers/api-app-roles');
var apiAppsRouter = require('./sys/server/routers/api-apps');
var apiChecksRouter = require('./sys/server/routers/api-checks');
var apiFilesRouter = require('./sys/server/routers/api-files');
var apiRolesRouter = require('./sys/server/routers/api-roles');
var apiUserRolesRouter = require('./sys/server/routers/api-user-roles');
var apiUsersRouter = require('./sys/server/routers/api-users');

var uiAppsRouter = require('./sys/server/routers/ui-apps');
var uiFilesRouter = require('./sys/server/routers/ui-files');
var uiViewsRouter = require('./sys/server/routers/ui-views');

//---------Helpers

//the request header to check for requests IDs
const X_BOLT_REQ_ID = 'X-Bolt-Req-Id';

//holds all the apps' request IDs
var __contextToReqidMap = new Map();
var __systemApps = ['bolt', 'bolt-settings']; //TODO: this list shud be gotten from the database

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

//pass in info native views can use
app.use(function(request, response, next) {
	request.contextToReqidMap = __contextToReqidMap;
	request.destroyAppReqId = __destroyAppReqId; //TODO: test this
	request.genAppReqId = __genAppReqId; //TODO: test this
	request.reqid = __genAppReqId('bolt');
	request.systemApps = __systemApps;

  	next();
});

//<API-Endpoints>
app.use('/api/app-roles', apiAppRolesRouter);

app.use('/api/apps', apiAppsRouter);

app.use('/api/checks', apiChecksRouter);

app.use('/api/files', apiFilesRouter);

app.use('/api/roles', apiRolesRouter);

app.use('/api/user-roles', apiUserRolesRouter);

app.use('/api/users', apiUsersRouter);

app.use('/api', apiRouter);
//</API-Endpoints>

//<UI-Endpoints>
app.use('/apps', uiAppsRouter);

app.use('/files', uiFilesRouter);

app.use(uiViewsRouter);
//</UI-Endpoints>

// catch 404 and forward to error handler
app.use(function(request, response, next) {
  var error = new Error("The endpoint '" + request.path + "' could not be found!");
  response
  	.set('Content-Type', 'application/json')
  	.end(utils.Misc.createResponse(null, error, 703));
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
		var mongodbPath = path.join(__dirname, 'sys/bins/mongodb/win32/mongod.exe');
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
										.post(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/apps/start')
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