var superagent = require('superagent');

var config = require("../config");
var errors = require("../errors");
var utils = require("../utils");

module.exports = {
	getApp: function(request, response){
		var appnm = utils.String.trim(request.params.app.toLowerCase());
		superagent
			.post(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/apps/start')
			.send({ app: appnm })
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
							var index = (!utils.Misc.isNullOrUndefined(context.app.index)) ? "/" + utils.String.trimStart(context.app.index, "/") : "";
							var query = "";
							if (!utils.Misc.isNullOrUndefined(request.session) && !utils.Misc.isNullOrUndefined(request.session.user)) { //a user is logged in
								query += "userid=" + request.session.user._id;
							}
							/*query = "&protocol=" + config.getProtocol()
									+ "&host=" + config.getHost()
									+ "&port=" + config.getPort()
									+ "&appPort=" + context.port;*/
							response.redirect(config.getProtocol() + '://' + context.host + ':' + context.port + index + "?" + query);
						}
						else {
							//TODO: maybe I shud show an error saying no port found for this app 
							//but I don't want to hand-craft any user error message since that will not be localizable
							//so I'll just be lazy here and show a 404
							response.redirect('/404?item=' + encodeURIComponent(appnm));
						}
					}
					else {
						response.redirect('/404?item=' + encodeURIComponent(appnm));
					}
				}
			});
	}
};
