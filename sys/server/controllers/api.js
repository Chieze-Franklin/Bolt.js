var superagent = require('superagent');

var config = require("../config");
var utils = require("../utils");

module.exports = {
	get: function(request, response){
		response.redirect('/api/help');
	},
	getHelp: function(request, response){
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

		response.send(utils.Misc.createResponse(system));
	}
};
