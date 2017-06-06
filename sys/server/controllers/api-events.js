var config = require("bolt-internal-config");
var utils = require("bolt-internal-utils");
var models = require("bolt-internal-models");
var sockets = require("bolt-internal-sockets");

var superagent = require('superagent');

module.exports = {
	postEvent: function(request, response){
		var evnt = {};
		evnt.body = request.body.body || {};
		evnt.name = utils.String.trim(request.params.name.toLowerCase());
		evnt.publisher = request.appName;
		//if(!utils.Misc.isNullOrUndefined(request.body.subscribers)) { evnt.subscribers = request.body.subscribers; }
		evnt.time = new Date();

		var criteria = { 
			$or: [{publisher: evnt.publisher}, {publisher: "*"}],
			$or: [{event: evnt.name}, {event: "*"}]
		};
		if(!utils.Misc.isNullOrUndefined(request.body.subscribers)) {
			criteria = { 
				$or: [{publisher: evnt.publisher}, {publisher: "*"}],
				$or: [{event: evnt.name}, {event: "*"}],
				subscriber: { $in: request.body.subscribers } 
			};
		}
		models.hook.find(criteria, function(error, hooks){
			if (!utils.Misc.isNullOrUndefined(hooks)) {
				hooks.forEach(function(hook){
					if (hook.type == "function") {
						//TODO:
						/*
						search for function where name={hook.router} and app={hook.subscriber}, returned as func
							if func is found
							event.token = request.genFunctionToken("{func.app}")//("{func.app}\{func.name}")
							event.bolt = process.env.BOLT_ADDRESS;
							var f = require("{node_modules}\{func.path}\{func.main}")
							f(event);
							//consider caching the function so we dont hv to do the long journey everytime
						*/
					}
					/*else if (hook.type == "router") {
						I would hv loved to support router types but:
							* Routers are not "exact". Multiple routers may be loaded on the same endpoint. We dont want another person's router
								function being invoked for an event you subscribed for, do we?
							* Maybe in the future
						
					}*/
					else if (hook.type == "web") {
						//TODO:
						/*
						during installation, the user is shown something like:
							The app {app-name} wants to register web hooks for the following events (You can change these at any time):
							| event            | web hook                               | action |
							----------------------------------------------------------------------
							| bolt/app-started | https://bolt-app-monitor.herokuapp.com | [Allow]|
						if the user allows, the web hook is registered for that app
						....
						//look for the right place to prepend "http://" in case it is missing 
							(shud it be prepended b4 checking registered urls or after??)
						if url is registered for the app (hook.subscriber)
							event.token = request.genWebHookToken("{hook.subscriber}")//("{hook.subscriber}\{url}")
							event.bolt = process.env.BOLT_ADDRESS;
							POST: url, body: event
						*/

						var url = hook.route;
						if (hook.route.indexOf("http://") != 0 && hook.route.indexOf("https://") != 0) {
							url = "http://" + hook.route;
						}

						var event = evnt;
						//event.token = ??? //TODO: how to generate tokens for web

						//start the subscriber server
						superagent
							.post(url)
							.send(event)
							.end(function(evntError, evntResponse){});
					}
					else { //if (hook.type == "server" || typeof hook.type == "undefined") {
						//start the subscriber server
						superagent
							.post(process.env.BOLT_ADDRESS + '/api/apps/start')
							.send({ name: hook.subscriber })
							.end(function(appstartError, appstartResponse){
								var context = appstartResponse.body.body;

								//POST the event
								if (!utils.Misc.isNullOrUndefined(context)) {
									var event = evnt;
									event.token = request.genAppToken(context.name); //set the event token to equal the app token

									if (!utils.Misc.isNullOrUndefined(context.port)) {
										superagent
											.post(context.protocol + '://' + context.host + ':' + context.port + ("/" + utils.String.trimStart(hook.route, "/")))
											.send(event)
											.end(function(evntError, evntResponse){});
									}
									else if (context.app.system) {
										superagent
											.post(process.env.BOLT_ADDRESS + "/x/" + context.name + ("/" + utils.String.trimStart(hook.route, "/")))
											.send(event)
											.end(function(evntError, evntResponse){});
									}
										
									/*//send event to socket for the app
									var socket = sockets.getSocket(context.name); //socket will always be undefined if context is running on another process
									if (!utils.Misc.isNullOrUndefined(socket)) 
										//socket.send(JSON.stringify(event));
										socket.broadcast.to(context.name).emit("message", JSON.stringify(event));*/
								}
							});
					}
				});
			}
		});

		//send event to socket for bolt
		var socket = sockets.getSocket("bolt");
		if (!utils.Misc.isNullOrUndefined(socket)) {
			var event = evnt;
			event.token = request.genAppToken("bolt"); //set the event token to equal he app token

			//socket.send(JSON.stringify(event));
			socket.broadcast.to("bolt").emit("message", JSON.stringify(event));
		}
		
		//send event to an event emitter so ppl can do something like BoltEventEmitter.on("bolt/user-login", callback)
			//do this only if no other component can make BoltEventEmitter to emit the event
			//I dont feel like doing this since everybody will get the event irrespective of the "subscribers" specified by the publisher
			
		//send a response back
		response.send();
	}
};
