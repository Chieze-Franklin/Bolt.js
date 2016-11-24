//var fs = require("fs");
var path = require("path");
var superagent = require('superagent');

var config = require("../config");
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
					else if (!utils.Misc.isNullOrUndefined(fileInfo) && !utils.Misc.isNullOrUndefined(fileInfo.fullPath) && !utils.Misc.isNullOrUndefined(fileInfo.stats)) {
						//response.writeHead(301, {Location: 'file:///' + fileInfo.fullPath});
						//response.end();

						response.redirect(301, 'file:///' + fileInfo.fullPath);

						/*var readStream = fs.createReadStream(fileInfo.fullPath);

						readStream.on('open', function () {
						    // This just pipes the read stream to the response object (which goes to the client)
						    readStream.pipe(response);
					  	});

						readStream.on('error', function(err) {
						    response.redirect('/error');
						});*/
					}
					else {
						response.redirect('/404?item=' + encodeURIComponent(request.params.app + '/' + request.params.file));
					}
				}
			});
	}
};
