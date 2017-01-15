'use strict';
var config = require("bolt-internal-config");

var exec = require('child_process').exec, child;
var http = require("http");
var path = require("path");
var superagent = require('superagent');

var __nameToAppPidMap = new Map();
var __nameToAppPortMap = new Map();
var __nameToChildProcessMap = new Map();
var __nameToChildProcessPortMap = new Map();

module.exports = {
	createProcess : function(context, callback){
		this.killProcess(context.name); //kill existing process first

		var childPath = path.join(__dirname, 'app_host.js');
		child = exec('node ' + childPath);

		child.stdout.on('data', function(data) { 
			if(data.indexOf("app_host.port=") == 0){ //if(data.startsWith("app_host.port="))
				var index = data.indexOf('=');
				var port = data.substr(index + 1);

				superagent
					.post(config.getProtocol() + '://' + config.getHost() + ':' + port + '/app-start')
					.send(context)
					.end(function(appstartError, appstartResponse){
						if (appstartError) {
							callback(appstartError, null);
						}
						else {
							context = appstartResponse.body;

							__nameToAppPidMap.set(context.name, context.pid);
							__nameToAppPortMap.set(context.name, context.port);
							__nameToChildProcessMap.set(context.name, child);
							__nameToChildProcessPortMap.set(context.name, port);

							callback(null, context);
						}
					});
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
	getAppPid : function(name){
		__nameToAppPidMap.get(name);
	},
	getAppPort : function(name){
		__nameToAppPortMap.get(name);
	},
	hasProcess : function(name){
		return __nameToChildProcessMap.has(name);
	},
	killProcess : function(name){
		if(this.hasProcess(name)){
			var child = __nameToChildProcessMap.get(name);
			if(child){
				child.kill();
				__nameToChildProcessMap.delete(name);
				__nameToChildProcessPortMap.delete(name);
				__nameToAppPortMap.delete(name);
				process.kill(__nameToAppPidMap.get(name));
				__nameToAppPidMap.delete(name);
			}
		}
	}
};