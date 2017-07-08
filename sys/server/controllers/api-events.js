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
					else if (hook.type == "web") {
						var url = hook.route;
						if (hook.route.indexOf("http://") != 0 && hook.route.indexOf("https://") != 0) {
							url = "http://" + hook.route;
						}

						var event = evnt;
						event.dispatchTime = new Date();
						event.bolt = {
							address: process.env.BOLT_ADDRESS
						};
						//event.token = ??? //TODO: how to generate tokens for web

						//start the subscriber server
						var smthn = superagent.post(url);
						if(!utils.Misc.isNullOrUndefined(request.body.headers)) {
							var headers = request.body.headers;
							for (var header in headers) {
								if (headers.hasOwnProperty(header)) {
									var headerValue = headers[header];
									smthn.set(header, headerValue);
								}
							}
						}
						smthn
							.send(event)
							.end(function(evntError, evntResponse){});
					}
					else { //if (hook.type == "server" || typeof hook.type == "undefined") {
						//start the subscriber server
						if (hook.subscriber == 'bolt') {
							var event = evnt;
							event.dispatchTime = new Date();
							event.token = request.genAppToken('bolt'); //set the event token to equal the app token

							var smthn = superagent.post(process.env.BOLT_ADDRESS + ("/" + utils.String.trimStart(hook.route, "/")));
							if(!utils.Misc.isNullOrUndefined(request.body.headers)) {
								var headers = request.body.headers;
								for (var header in headers) {
									if (headers.hasOwnProperty(header)) {
										var headerValue = headers[header];
										smthn.set(header, headerValue);
									}
								}
							}
							smthn
								.send(event)
								.end(function(evntError, evntResponse){});

							//send event to socket for bolt
							var socketsForApp = sockets.getSockets("bolt");
							socketsForApp.forEach(function(socket) {
								if (!utils.Misc.isNullOrUndefined(socket)) {
									socket.send(JSON.stringify(event));
									//socket/*.broadcast.to("bolt")*/.emit("message", JSON.stringify(event));
								}
							});
						}
						else {
							superagent
								.post(process.env.BOLT_ADDRESS + '/api/apps/start')
								.send({ name: hook.subscriber })
								.end(function(appstartError, appstartResponse){
									var context = appstartResponse.body.body;

									//POST the event
									if (!utils.Misc.isNullOrUndefined(context)) {
										var event = evnt;
										event.dispatchTime = new Date();
										event.token = request.genAppToken(context.name); //set the event token to equal the app token

										var smthn = superagent;

										var socketName = context.name;
										if (!utils.Misc.isNullOrUndefined(context.port)) {
											smthn = superagent.post(context.protocol + '://' + context.host + ':' + context.port + ("/" + utils.String.trimStart(hook.route, "/")));
										}
										else if (context.app.system) {
											socketName = "bolt";
											smthn = superagent.post(process.env.BOLT_ADDRESS + "/x/" + context.name + ("/" + utils.String.trimStart(hook.route, "/")));
										}

										if(!utils.Misc.isNullOrUndefined(request.body.headers)) {
											var headers = request.body.headers;
											for (var header in headers) {
												if (headers.hasOwnProperty(header)) {
													var headerValue = headers[header];
													smthn.set(header, headerValue);
												}
											}
										}

										smthn
											.send(event)
											.end(function(evntError, evntResponse){});
											
										//send event to socket for the app
										var socketsForApp = sockets.getSockets(socketName);
										socketsForApp.forEach(function(socket) { //socket will always be undefined if context is running on another process
											if (!utils.Misc.isNullOrUndefined(socket)) {
												socket.send(JSON.stringify(event));
												//socket/*.broadcast.to(socketName)*/.emit("message", JSON.stringify(event));
											}
										});
									}
								});
						}
					}
				});
			}
		});
			
		//send a response back
		response.send();
	},
	postSub: function(request, response){
		var hook = request.params[0];
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
			subscriber: request.appName,
			transient: true
		});

		var hookObj = request.body;
		newHook.route = hookObj.route;
		if (!utils.Misc.isNullOrUndefined(hookObj.type)) newHook.type = hookObj.type.toString().toLowerCase();

		newHook.save();
		response.send();
	},
	deleteSub: function(request, response){
		var hook = request.params[0];
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

		models.hook.remove({ 
			event: evnt, 
			publisher: publisher,
			subscriber: request.appName,
			transient: true 
		}, function(hookRemoveError){});
		response.send();
	}
};
