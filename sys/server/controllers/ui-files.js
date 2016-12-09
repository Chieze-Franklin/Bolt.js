//var fs = require("fs");
var path = require("path");
var superagent = require('superagent');

var config = require("../config");
var errors = require("../errors");
var utils = require("../utils");

module.exports = {
	getAppFile: function(request, response){
		superagent
			.get(config.getProtocol() + '://' + config.getHost() + ':' + config.getPort() + '/api/files/' + request.params.app + '/' + request.params.file)
			.end(function(error, fileinfoResponse){
				if (!utils.Misc.isNullOrUndefined(error)) {
					response.redirect('/error');
				}
				else {
					var responseError = fileinfoResponse.body.error;
					var fileInfo = fileinfoResponse.body.body;

					if (!utils.Misc.isNullOrUndefined(responseError)) {
						var encodedCode = encodeURIComponent(fileinfoResponse.body.code);
						if(!utils.Misc.isNullOrUndefined(responseError.errorUserTitle) && !utils.Misc.isNullOrUndefined(responseError.errorUserMessage)) {
							var encodedTitle = encodeURIComponent(responseError.errorUserTitle);
							var encodedMessage = encodeURIComponent(responseError.errorUserMessage);
							response.redirect('/error?code=' + encodedCode + '&error_user_title=' + encodedTitle + '&error_user_message=' + encodedMessage);
						}
						else {
							response.redirect('/error?code=' + encodedCode);
						}
					}
					else if (!utils.Misc.isNullOrUndefined(fileInfo) && !utils.Misc.isNullOrUndefined(fileInfo.publicPath) && !utils.Misc.isNullOrUndefined(fileInfo.stats)) {
						response.redirect(fileInfo.publicPath);
					}
					else {
						response.redirect('/404?item=' + encodeURIComponent(request.params.app + '/' + request.params.file));
					}
				}
			});
	}
};