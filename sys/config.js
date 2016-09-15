'use strict';

var fs = require("fs");

var __ports;
var __config;
var getConfig = function(){
	if(__config) return __config;

	//fs.readFile(__dirname + '/sys/' + 'config.json', 'utf8', function (err, data) {
	//	__config = JSON.parse(data);
	//});

	var data = fs.readFileSync( __dirname + '/config.json'); //deliberately reading the file sync
	__config = JSON.parse(data);
	return __config;
}

module.exports = {
	getAppPortEnd : function(){
		return getConfig().app_port_end;
	},
	getAppPorts : function(){
		if(__ports) return __ports;

		__ports = [];
		for(var i = getConfig().app_port_start; i <= getConfig().app_port_end; i++){
			__ports.push(i);
		}
		return __ports;
	},
	getAppPortStart : function(){
		return getConfig().app_port_start;
	},
	getHost : function(){
		return getConfig().host;
	},
	getPort : function(){
		return getConfig().port;
	}
};