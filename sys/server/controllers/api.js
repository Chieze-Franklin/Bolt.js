var superagent = require('superagent');

var config = require("../config");
var errors = require("../errors");
var utils = require("../utils");

module.exports = {
	get: function(request, response){
		response.redirect('/api/help');
	},
	getHelp: function(request, response){
		//response.send(request.app._router.stack); return; //run this to see the structure of 'app._router.stack'

		//TODO: consider making it possible to know the state of an endpoint: deprecated, stable, internal, unstable

		var system = {
			name: config.getName(),
			friendlyName: config.getFriendlyName(),
			version: config.getVersion(),
			friendlyVersion: config.getFriendlyVersion()
		};
		var routes = [];
		var paths = [];
		request.app._router.stack.forEach(function(r){
			var entry = {};
			var entrySummary = "";
			var route;

			if(r.route && r.route.path){
				route = r.route;

				if(route.stack && route.stack.length > 0){
					
					var handler = route.stack[0];
					if(handler.method){
						entry.method = handler.method;
						entrySummary += handler.method + ": ";
					}

					entry.path = route.path;
					entrySummary += route.path;

					routes.push(entry);
					paths.push(entrySummary);

					/*route.stack.forEach(function(handler){
						if(handler.method){
							entry.method = handler.method;
							entrySummary += handler.method + ": ";
						}
						entry.path = route.path;
						entrySummary += route.path;

						routes.push(entry);
						paths.push(entrySummary);
					});*/
				}
			}
			else if(r.name === 'router'){
				route = r.handle;
				console.log(route); //TODO:
				/*/r.handle.stack.forEach(function(stackEntry){
					route = stackEntry.route;

					if(route && route.path && route.stack && route.stack.length > 0){
						console.log(route);
						var handler = route.stack[0];
						if(handler.method){
							entry.method = handler.method;
							entrySummary += handler.method + ": ";
						}

						entry.path = route.path;
						entrySummary += route.path;

						routes.push(entry);
						paths.push(entrySummary);
					}
				});/*/
			}
		});

		system.paths = paths;
		system.routes = routes;

		response.send(utils.Misc.createResponse(system));
	}
};
