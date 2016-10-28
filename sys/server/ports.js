'use strict';

var net = require("net");

var __ports = [];
var __pathPortMap = new Map();
var __pathServerMap = new Map();

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

		var s = app.listen(0, function(){
			var port = s.address().port;
			__ports.push(port);
			__pathPortMap.set(path, port);
			__pathServerMap.set(path, s);
			callback(null, port);
		});
	}
};