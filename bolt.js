/*jslint node: true */
/*global Map */

'use strict';

var models = require("bolt-internal-models");
var sockets = require("bolt-internal-sockets");
var utils = require("bolt-internal-utils");

var exec = require('child_process').exec, child;
var express = require("express");
var mongoose = require('mongoose');
var path = require("path");
var request = require("request");

var configure = require("./sys/server/configure");

var apiAppRolesRouter = require('./sys/server/routers/api-app-roles');
var apiAppsRouter = require('./sys/server/routers/api-apps');
var apiChecksRouter = require('./sys/server/routers/api-checks');
var apiFilesRouter = require('./sys/server/routers/api-files');
var apiRolesRouter = require('./sys/server/routers/api-roles');
var apiTokensRouter = require('./sys/server/routers/api-tokens');
var apiUserRolesRouter = require('./sys/server/routers/api-user-roles');
var apiUsersRouter = require('./sys/server/routers/api-users');

var uiAppsRouter = require('./sys/server/routers/ui-apps');
var uiFilesRouter = require('./sys/server/routers/ui-files');
var uiViewsRouter = require('./sys/server/routers/ui-views');

//---------Helpers

//maps contexts to app tokens
var __contextToAppTokenMap = new Map();

var __destroyAppToken = function (app) {
    if (__contextToAppTokenMap.has(app)) {
        __contextToAppTokenMap.delete(app);
    }
};

var __genAppToken = function (app) {
    if (__contextToAppTokenMap.has(app)) {
        return __contextToAppTokenMap.get(app);
    }

    var id = utils.String.getRandomString(24);
    __contextToAppTokenMap.set(app, id);

    return id;
};

var __addErrorHandlerMiddleware = function(app) {
	app.use($_); //error handler
}
var __removeErrorHandlerMiddleware = function(app) {
	function removeMiddleware(route, index, routes) {
	    switch (route.handle.name) {
	        case '$_': routes.splice(index, 1);
	    }
	    if (route.route) {
	        route.route.stack.forEach(removeMiddleware);
	    }
	}
	var routes = app._router.stack;
	routes.forEach(removeMiddleware);
}

var __loadRouters = function(app) {
	//remove '$_'
	__removeErrorHandlerMiddleware(app);

	//load routers
	models.router.find({}, function (err, routers) {
        if (utils.Misc.isNullOrUndefined(err) && !utils.Misc.isNullOrUndefined(routers)) {
        	routers.sort(function (a, b) {
                var orderA = a.order || 0;
                var orderB = b.order || 0;
                return parseInt(orderA, 10) - parseInt(orderB, 10);
            });
            var loadRouter = function (idx) {
                if (idx >= routers.length) {
                    __addErrorHandlerMiddleware(app);
            		console.log('');
                } else {
                	var rtr = routers[idx];
                    if (!utils.Misc.isNullOrUndefined(rtr.main)) {
	                    var router = require(path.join(__dirname, 'node_modules', rtr.path, rtr.main));
	                    //load the router only if its app is a system app
	                    models.app.findOne({name: rtr.app, system: true}, function(systemAppError, systemApp){
	                    	if (utils.Misc.isNullOrUndefined(systemAppError) && !utils.Misc.isNullOrUndefined(systemApp)) {
	                    		if (utils.Misc.isNullOrUndefined(rtr.root)) {
		                            app.use(router);
		                        } else {
		                            app.use("/" + utils.String.trimStart(rtr.root, "/"), router);
		                        }
		                        console.log("Loaded router%s%s%s",
		                                (!utils.Misc.isNullOrUndefined(rtr.name)
		                            ? " '" + rtr.name + "'"
		                            : ""),
		                                (!utils.Misc.isNullOrUndefined(rtr.app)
		                            ? " (" + rtr.app + ")"
		                            : ""),
		                                (!utils.Misc.isNullOrUndefined(rtr.root)
		                            ? " on " + rtr.root
		                            : ""));
                                utils.Events.fire('app-router-loaded', { body: utils.Misc.sanitizeRouter(rtr) }, __genAppToken('bolt'), function(eventError, eventResponse){});
		                        loadRouter(++idx);
	                    	}
	                    	else {
	                    		loadRouter(++idx);
	                    	}
	                    });
	                }
	                else {
	                	loadRouter(++idx);
	                }
                }
            };

            loadRouter(0);
        }
    });
};

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
app.use(function (request, response, next) {
	request.addErrorHandlerMiddleware = __addErrorHandlerMiddleware;
    request.contextToAppTokenMap = __contextToAppTokenMap;
    request.destroyAppToken = __destroyAppToken; //TODO: test this
    request.genAppToken = __genAppToken; //TODO: test this
    request.loadRouters = __loadRouters;
    request.removeErrorHandlerMiddleware = __removeErrorHandlerMiddleware;

    request.appToken = __genAppToken('bolt');

    next();
});

//<API-Endpoints>
app.use('/api/app-roles', apiAppRolesRouter);

app.use('/api/apps', apiAppsRouter);

app.use('/api/checks', apiChecksRouter);

app.use('/api/files', apiFilesRouter);

app.use('/api/roles', apiRolesRouter);

app.use('/api/tokens', apiTokensRouter);

app.use('/api/user-roles', apiUserRolesRouter);

app.use('/api/users', apiUsersRouter);
//</API-Endpoints>

//<UI-Endpoints>
app.use('/apps', uiAppsRouter);

app.use('/files', uiFilesRouter);

app.use(uiViewsRouter);
//</UI-Endpoints>

// catch 404 and forward to error handler
var $_ = function (request, response) {
    var error = new Error("The endpoint '" + request.path + "' could not be found!");
    response
        .set('Content-Type', 'application/json')
        .end(utils.Misc.createResponse(null, error, 103));
};

var server = app.listen(process.env.PORT || process.env.BOLT_PORT, function () {
    var port = server.address().port;console.log(">>>>>>>>>>>>>>>>>>>>", port)
    console.log("Bolt Server running on port %s", port);
    console.log('');

    //listen for 'uncaughtException' so it doesnt crash our system
    process.on('uncaughtException', function (error) {
        console.log(error);
        console.log(error.stack);
        console.trace();
    });

    process.on('exit', function (code) {
        console.log("Shutting down with code " + code);
    });

    //TODO: how do I check Bolt source hasnt been altered

    //socket.io
    sockets.createSocket("bolt", server);

    mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI || process.env.BOLT_DB_URI);
    mongoose.connection.on('open', function () {
        //load routers
        __loadRouters(app);
        //start start-up apps
        models.app.find({
            startup: true
        }, function (err, apps) {
            var startups = [];
            if (utils.Misc.isNullOrUndefined(err) && !utils.Misc.isNullOrUndefined(apps)) {
                apps.forEach(function (app) {
                    startups.push(app.name);
                });
            }

            var runStartups = function (index) {
                if (index >= startups.length) {
                    console.log('============================================');
                    console.log('');
                } else {
                    var name = startups[index];
                    request
                        .post({url: process.env.BOLT_ADDRESS + '/api/apps/start', json: {name: name}}, 
                        function(appstartError, appstartResponse, appstartBody) {
                            if (!utils.Misc.isNullOrUndefined(appstartError)) {
                                runStartups(++index);
                                return;
                            }

                            var context = appstartBody.body;

                            if (!utils.Misc.isNullOrUndefined(context)) {
                                if (!utils.Misc.isNullOrUndefined(context.port)) {
                                    console.log("Started startup app%s%s at %s:%s",
                                            (!utils.Misc.isNullOrUndefined(context.app.displayName)
                                        ? " '" + context.app.displayName + "'"
                                        : ""),
                                            (!utils.Misc.isNullOrUndefined(context.name)
                                        ? " (" + context.name + ")"
                                        : ""),
                                            (!utils.Misc.isNullOrUndefined(context.host)
                                        ? context.host
                                        : ""),
                                        context.port);
                                }
                                else {
                                    console.log("Started startup app%s",
                                            (!utils.Misc.isNullOrUndefined(context.app.displayName)
                                        ? " '" + context.app.displayName + "'"
                                        : ""),
                                            (!utils.Misc.isNullOrUndefined(context.name)
                                        ? " (" + context.name + ")"
                                        : ""));
                                }
                            }
                            runStartups(++index);
                        });
                }
            };

            runStartups(0);
        });
    });
});

module.exports = server;