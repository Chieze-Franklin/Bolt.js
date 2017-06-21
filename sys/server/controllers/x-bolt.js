var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var superagent = require('superagent');

const X_BOLT_APP_TOKEN = 'X-Bolt-App-Token';

module.exports = {
	postHooksBoltAppDeleted: function(request, response) {
		var event = request.body;
		//TODO: verify the event
		var app = event.body;

		//delete app-roles
		superagent
			.delete(process.env.BOLT_ADDRESS + "/api/app-roles?app=" + app.name)
			.set(X_BOLT_APP_TOKEN, request.appToken)
			.end(function(err, res){});

		//delete app-users
		superagent
			.delete(process.env.BOLT_ADDRESS + "/api/app-users?app=" + app.name)
			.set(X_BOLT_APP_TOKEN, request.appToken)
			.end(function(err, res){});

		/*//delete collections
		superagent
			.post(process.env.BOLT_ADDRESS + "/api/db/drop")
			.set(X_BOLT_APP_TOKEN, request.genAppToken(app.name))
			.send({app: app.name})
			.end(function(err, res){});*/
		//-----------------------------
		//why are we not deleting db here?
		//it is possible that an app may be deleted without its database being deleted (for instance during app update)
	},
	postHooksBoltAppRouterLoaded: function(request, response) {
		var event = request.body;
		//TODO: verify the event
		var rtr = event.body;
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
	},
	postHooksBoltAppStarted: function(request, response) {
		//TODO: create app-user object, or increase starts by 1 if it already exists
		var event = request.body;
		//TODO: verify the event
		var context = event.body;
		var user = request.user;

		if(!utils.Misc.isNullOrUndefined(context) && !utils.Misc.isNullOrUndefined(user)) {
			models.appUserAssoc.findOne({ app: context.name, user: user.name }, function(errorAppUser, appUser){
				if (utils.Misc.isNullOrUndefined(appUser)) { 
					//create app-user object
					superagent
						.post(process.env.BOLT_ADDRESS + "/api/app-users")
						.set(X_BOLT_APP_TOKEN, request.appToken) //TODO: check request.appToken for foreign requests
						.send({ app: context.name, user: user.name, starts: 1 })
						.end(function(err, res){});
				}
				else {
					//increase starts by 1 if it already exists
					appUser.starts += 1;
					appUser.lastStart = new Date();
					appUser.save();
				}
			});
		}

		response.send();
	},
	postHooksBoltRoleDeleted: function(request, response) {
		//when a role is deleted, delete relevant app-roles and user-roles
		var event = request.body;
		//TODO: verify the event
		var role = event.body;

		//delete app-roles
		superagent
			.delete(process.env.BOLT_ADDRESS + "/api/app-roles?role=" + role.name)
			.set(X_BOLT_APP_TOKEN, request.appToken)
			.end(function(err, res){});

		//delete user-roles
		superagent
			.delete(process.env.BOLT_ADDRESS + "/api/user-roles?role=" + role.name)
			.set(X_BOLT_APP_TOKEN, request.appToken)
			.end(function(err, res){});

		response.send();
	},
	postHooksBoltUserDeleted: function(request, response) {
		//when a user is deleted, delete relevant user-roles and app-users
		var event = request.body;
		//TODO: verify the event
		var user = event.body;

		//delete app-users
		superagent
			.delete(process.env.BOLT_ADDRESS + "/api/app-users?user=" + user.name)
			.set(X_BOLT_APP_TOKEN, request.appToken)
			.end(function(err, res){});

		//delete user-roles
		superagent
			.delete(process.env.BOLT_ADDRESS + "/api/user-roles?user=" + user.name)
			.set(X_BOLT_APP_TOKEN, request.appToken)
			.end(function(err, res){});

		response.send();
	}
};
