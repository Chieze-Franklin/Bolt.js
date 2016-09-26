'use strict';

var net = require("net");

var config = require("./config");

var __ports = [];
var __pathPortMap = new Map();
var __pathServerMap = new Map();

var __noAvailablePortError = function(){
	var error = new Error("no available port");
	error.code = "JAYSOS.SYS.PORTS.NO_PORT";
	return error;
}

var __portIsFree = function(port, callback){
	var server = net.createServer(function (socket){
		socket.write('Echo server\r\n');
		socket.pipe(socket);
	});

	server.once('error', function(e){
		//if(e.code === 'EADDRINUSE')
		callback(false, port);
	});
	server.once('listening', function(e){
		server.once('close', function(){ callback(true, port); });
		server.close();
	});

	server.listen(port, config.getHost());
}

module.exports = {
	hasPort : function(path){
		return __pathPortMap.has(path);
	},
	closePort : function(path){
		if(this.hasPort(path)){
			var port = __pathPortMap.get(path);
			if(__ports.indexOf(port) > -1){
				__ports.pop(port);
			__pathPortMap.delete(path);
			}

			var server = __pathServerMap.get(path);
			if(server){
				server.close();
				__pathServerMap.delete(path);
			}
		}
	},
	getPort : function(path){
		if(__pathPortMap.has(path)){
			return __pathPortMap.get(path);
		}
	},
	makePort : function(path, app, callback){
		this.closePort(path);

		var appPorts = config.getAppPorts();
		var __callback = function(isfree, port){
			console.log(port + ': ' + isfree);///////////////////////
			//if(isfree){
				process.once('uncaughtException', function(e){ 
					if(e.code === 'EADDRINUSE') {
						console.log("gat u inside");///////////////////////
						__ports.push(port);
						port++;
						if(appPorts.indexOf(port) > -1){
							__portIsFree(port, __callback);
						}
						else{
							callback(__noAvailablePortError());
						}
					}
				});
				var s = app.listen(port, function(){
					__ports.push(port);
					__pathPortMap.set(path, port);
					__pathServerMap.set(path, s);
					console.log(port);/////////////////////////////
					callback(null, port);
				});
			//}
			//else{
			//	__ports.push(port);
			//	port++;
			//	if(appPorts.indexOf(port) > -1){
			//		__portIsFree(port, __callback);
			//	}
			//	else{
			//		callback(__noAvailablePortError());
			//	}
			//}
		}

		//gets the first port in config.getAppPorts() that is not in __ports
		var firstFreeAppPort = null;
		for (var i = 0; i < appPorts.length; i++) {
			var port = appPorts[i];
			if(__ports.indexOf(port) == -1){
				firstFreeAppPort = port;
				break;
			}
		}
		console.log("first free " + firstFreeAppPort);///////////////
		if(firstFreeAppPort !== undefined && firstFreeAppPort !== null)
			__portIsFree(firstFreeAppPort, __callback);
		else
			callback(__noAvailablePortError());
	}
};