var superagent = require('superagent');

var config = require("../config");
var errors = require("../errors");
var utils = require("../utils");

module.exports = {
	getApp: function(request, response){
		var appnm = utils.String.trim(request.params.name.toLowerCase());
		superagent
			.post(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/apps/start')
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
						if(!utils.Misc.isNullOrUndefined(context.port)){
							var route = "";
							if (!utils.Misc.isNullOrUndefined(request.query.route)) { 
								route = request.query.route;
							}
							else {
								route = (!utils.Misc.isNullOrUndefined(context.app.index)) ? "/" + utils.String.trimStart(context.app.index, "/") : "";
							}
							response.redirect(config.getProtocol() + '://' + context.host + ':' + context.port + route);
						}
						else {
							/* OLD METHOD (feel free to delete this commented section (don't even know why I'm relectant to do so))
							//TODO: maybe I shud show an error saying no port found for this app 
							//but I don't want to hand-craft any user error message since that will not be localizable
							//so I'll just be lazy here and show a 404
							response.redirect('/404?item=' + encodeURIComponent(appnm));
							*/

							/*NEW METHOD*/
							//if context.port is missing, it's probably because this app has no server
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
