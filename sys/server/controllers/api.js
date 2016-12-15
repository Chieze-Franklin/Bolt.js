var superagent = require('superagent');

var config = require("../config");
var errors = require("../errors");
var getRoutes = require("../get-routes");
var utils = require("../utils");

module.exports = {
	get: function(request, response){
		response.redirect('/api/help');
	},
	getHelp: function(request, response){
		//response.send(request.app._router.stack); return; //run this to see the structure of 'app._router.stack'

		//TODO: consider making it possible to know the state of an endpoint: deprecated, stable, internal, unstable
		//console.log(require('get-routes')(request.app));

		var system = {
			name: config.getName(),
			friendlyName: config.getFriendlyName(),
			version: config.getVersion(),
			minimumVersion: config.getMinimumVersion(),
			friendlyVersion: config.getFriendlyVersion()
		};

		var summary = getRoutes.summary(request.app);;
		system.paths = summary.paths;
		system.routes = summary.routes;
		system.lines = summary.lines;
		//system.treeView = getRoutes.treeView(request.app);

		response.send(utils.Misc.createResponse(system));
	}
};
