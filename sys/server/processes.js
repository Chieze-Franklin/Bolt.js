'use strict';

var exec = require('child_process').exec, child;
var http = require("http");
var path = require("path");

var __pathToAppPidMap = new Map();
var __pathToAppPortMap = new Map();
var __pathToChildProcessMap = new Map();
var __pathToChildProcessPortMap = new Map();

module.exports = {
	createProcess : function(context, callback){
		this.killProcess(context.path); //kill existing process first

		var childPath = path.join(__dirname, 'app_host.js');
		child = exec('node ' + childPath);

		child.stdout.on('data', function(data) { 
			if(data.indexOf("app_host.port=") == 0){ //if(data.startsWith("app_host.port="))
				var index = data.indexOf('=');
				var port = data.substr(index + 1);

				var opt = {
					method: 'post',
					//host: config.getHost(),
					port: port,
					path: '/app-start',
					headers: {
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(JSON.stringify(context))
					}
				};

				var rq = http.request(opt, function(rs){
					var bdy = '';
					rs.on('data', function(d) {
						bdy += d;
					});
					rs.on('end', function() {
						context = JSON.parse(bdy);

						__pathToAppPidMap.set(context.path, context.pid);
						__pathToAppPortMap.set(context.path, context.port);
						__pathToChildProcessMap.set(context.path, child);
						__pathToChildProcessPortMap.set(context.path, port);

						callback(null, context);
					});
				});

				rq.write(JSON.stringify(context));
				rq.end();
			}
			else{
				console.log(data);
			}
		});

		child.stderr.on('data', function(data){ console.log(data); });

		child.on('close', function(code, signal){ 
			console.log("child process ", child.pid, " closing with code ", code); 
			//TODO: remove child process; remove ports (child port, app port), pid associated with same path as child process (or just call killProcess(path))
			//TODO: raise event (with the context.path) to let ppl know its process has shut down
		});
	},
	getAppPid : function(path){
		__pathToAppPidMap.get(path);
	},
	getAppPort : function(path){
		__pathToAppPortMap.get(path);
	},
	hasProcess : function(path){
		return __pathToChildProcessMap.has(path);
	},
	killProcess : function(path){
		if(this.hasProcess(path)){
			var child = __pathToChildProcessMap.get(path);
			if(child){
				child.kill();
				__pathToChildProcessMap.delete(path);
				__pathToChildProcessPortMap.delete(path);
				__pathToAppPortMap.delete(path);
				process.kill(__pathToAppPidMap.get(path));
				__pathToAppPidMap.delete(path);
			}
		}
	}
};