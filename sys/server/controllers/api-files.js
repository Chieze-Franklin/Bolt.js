var errors = require("bolt-internal-errors");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var fs = require('fs');
var path = require("path");
var superagent = require('superagent');

var __publicDir = path.join(__dirname + './../../../public');

module.exports = {
	getAppFile: function(request, response){
		var appnm = utils.String.trim(request.params.app.toLowerCase());
		models.app.findOne({ 
			name: appnm
		}, function(error, app){
			if (!utils.Misc.isNullOrUndefined(error)) {
				response.end(utils.Misc.createResponse(null, error));
			}
			else if(utils.Misc.isNullOrUndefined(app)){
				var err = new Error(errors['403']);
				response.end(utils.Misc.createResponse(null, err, 403));
			}
			else{
				var fileInfo;

				var files = app.files;
				for (var file in files){
					if (files.hasOwnProperty(file)){
						if (file === request.params.file) {
							fileInfo = {
								name: file,
								path: files[file]
							};
							break;
						}
					}
				}

				if (!utils.Misc.isNullOrUndefined(fileInfo) && !utils.Misc.isNullOrUndefined(fileInfo.path)) {
					fileInfo.publicPath = process.env.BOLT_ADDRESS + "/public/" + app.name + "/" + fileInfo.path;
					var staticPath = path.join(__publicDir, app.name, fileInfo.path);
					fs.stat(staticPath, function(fsError, stats) {
						if (!utils.Misc.isNullOrUndefined(fsError)) {
							fileInfo.error = fsError;
						}
						else {
							fileInfo.stats = {
								accessTime: stats.atime,
								creationTime: stats.birthtime,
								isDirectory: stats.isDirectory(),
								isFile: stats.isFile(),
								isSocket: stats.isSocket(),
								modifiedTime: stats.mtime,
								size: stats.size,
								statsChangedTime: stats.ctime,
							};
						}
						response.send(utils.Misc.createResponse(fileInfo));
					});
				}
				else {
					response.send(utils.Misc.createResponse(fileInfo));
				}
			}
		});
	}
};
