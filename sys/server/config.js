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
	getAppPortEnd : function(){ //deprecated (for now)
		return getConfig().appPortEnd;
	},
	getAppPorts : function(){ //deprecated (for now); see {root folder}/__raw/ports2.js for how it was used
		if(__ports) return __ports;

		__ports = [];
		for(var i = getConfig().appPortStart; i <= getConfig().appPortEnd; i++){
			__ports.push(i);
		}
		return __ports;
	},
	getAppPortStart : function(){ //deprecated (for now)
		return getConfig().appPortStart;
	},

	getDbHost : function(){
		return getConfig().dbHost;
	},
	getDbPort : function(){
		return getConfig().dbPort;
	},
	getFriendlyName : function(){
		return getConfig().friendlyName;
	},
	getFriendlyVersion : function(){
		return getConfig().friendlyVersion;
	},
	getHost : function(){
		return getConfig().host;
	},
	getMultiWindow : function(){
		return getConfig().multiWindow;
	},
	getName : function(){
		return getConfig().name;
	},
	getPort : function(){
		return getConfig().port;
	},
	getProtocol : function(){
		return getConfig().protocol;
	},
	getVersion : function(){
		return getConfig().version;
	}
};