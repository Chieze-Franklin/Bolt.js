var errors = require("../errors");
var utils = require("../utils");

//the request header to check for requests IDs
const X_BOLT_REQ_ID = 'X-Bolt-Req-Id';

var __getAppFromReqId = function(id, request) {
	for (var entry of request.contextToReqidMap) {
		if (entry[1] === id) { //value === id
			return entry[0]; //return key
		}
	}
}

module.exports = {
	forAdminRight: function(request, response, next){
		next(); //TODO: check if user has admin privilege
	},
	forAppRight: function(request, response, next){
		next(); //TODO: check if user has right to start :app (dont check if it's a startup app)
	},
	forAppFileRight: function(request, response, next){
		next(); //TODO: check (app-role.files) if user has right to access this :file
	},
	//checks to be sure the app making this request is a system app
	forSystemApp: function(request, response, next){
		var id;
		if (!utils.Misc.isNullOrUndefined(request.reqid)) {
			id = request.reqid;
		}
		else {
			id = request.get(X_BOLT_REQ_ID);
		}

		var name = __getAppFromReqId(id, request);
		var appnm = utils.String.trim(name.toLowerCase());

		if (appnm == 'bolt') {
			//native views
			next();
		}
		else {
			models.app.findOne({ 
				name: appnm, system: true
			}, function(error, app){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.end(utils.Misc.createResponse(null, error));
				}
				else if(utils.Misc.isNullOrUndefined(app)){
					var error = new Error(errors['504']);
					response.end(utils.Misc.createResponse(null, error, 504));
				}
				else{
					next();
				}
			});
		}
	},
	forUserPermToInstall: function(request, response, next){
		next(); //TODO: check if app has user's permission to install an app (remember system apps need no permission)
	}
};
