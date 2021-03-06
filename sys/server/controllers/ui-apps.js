var errors = require("bolt-internal-errors");
var utils = require("bolt-internal-utils");

var superagent = require('superagent');

const X_BOLT_USER_NAME = 'X-Bolt-User-Name';
const X_BOLT_USER_TOKEN = 'X-Bolt-User-Token';

module.exports = {
	getApp: function(request, response){
		var appnm = utils.String.trim(request.params.name.toLowerCase());

		var smthn = superagent.post(process.env.BOLT_ADDRESS + '/api/apps/start');
		if(!utils.Misc.isNullOrUndefined(request.user)) smthn = smthn.set(X_BOLT_USER_NAME, request.user.name);
		else if(!utils.Misc.isNullOrUndefined(request.get(X_BOLT_USER_NAME))) smthn = smthn.set(X_BOLT_USER_NAME, request.get(X_BOLT_USER_NAME));
		if(!utils.Misc.isNullOrUndefined(request.get(X_BOLT_USER_TOKEN))) smthn = smthn.set(X_BOLT_USER_TOKEN, request.get(X_BOLT_USER_TOKEN));
		
		smthn
			.send({ name: appnm })
			.end(function(error, appstartResponse){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.redirect('/error');
				}
				else {
					var responseError = appstartResponse.body.error;
					var context = appstartResponse.body.body;

					if (!utils.Misc.isNullOrUndefined(responseError)) {
						var encodedCode = encodeURIComponent(appstartResponse.body.code);
						if(!utils.Misc.isNullOrUndefined(responseError.errorUserTitle) && !utils.Misc.isNullOrUndefined(responseError.errorUserMessage)) {
							var encodedTitle = encodeURIComponent(responseError.errorUserTitle);
							var encodedMessage = encodeURIComponent(responseError.errorUserMessage);
							response.redirect('/error?code=' + encodedCode + '&error_user_title=' + encodedTitle + '&error_user_message=' + encodedMessage);
						}
						else {
							response.redirect('/error?code=' + encodedCode);
						}
					}
					else if (!utils.Misc.isNullOrUndefined(context)) {
						var route = "";
						if (!utils.Misc.isNullOrUndefined(request.query.route)) { 
							route = "/" + utils.String.trimStart(request.query.route, "/");
						}
						else {
							route = (!utils.Misc.isNullOrUndefined(context.app.index)) ? "/" + utils.String.trimStart(context.app.index, "/") : "";
						}
						var query = "";
						if (!utils.Misc.isNullOrUndefined(request.query.query)) { 
							query = "?" + utils.String.trimStart(request.query.query, "?");
						}

						if(!utils.Misc.isNullOrUndefined(context.port)){
							response.redirect(context.protocol + '://' + context.host + ':' + context.port + route + query);
						}
						else if (context.app.system) {
							response.redirect(process.env.BOLT_ADDRESS + '/x/' + appnm + route + query);
						}
						else {
							//if context.port is missing and context.app.system is false, it's probably because this app has no server
							//so we (quite lazily) assume it has a public file called "index"
							response.redirect('/files/' + appnm + '/index');
						}
					}
					else {
						response.redirect('/404?item=' + encodeURIComponent(appnm));
					}
				}
			});
	}
};
