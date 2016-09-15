'use strict';

var fs = require("fs");

var __pckgs;
var getPackages = function(){
	if(__pckgs) return __pckgs;

	var data = fs.readFileSync( __dirname + '/packages.json'); //deliberately reading the file sync
	__pckgs = JSON.parse(data);
	return __pckgs;
}

module.exports = {
	getAppPath : function(id){
		var p = getPackages();
		for (var i = 0; i < p.apps.length; i++) {
			var entry = p.apps[i]
			if(entry.id === id){
				return entry.path;
			}
		}
	},
	getFullPath : function(short){
		var p = getPackages();
		for (var i = 0; i < p.shorts.length; i++) {
			var entry = p.shorts[i]
			if(entry.short === short){
				return entry.full;
			}
		}
	},
	getTagPaths : function(tag){
		var p = getPackages();
		for (var i = 0; i < p.tags.length; i++) {
			var entry = p.tags[i]
			if(entry.tag === tag){
				return entry.paths;
			}
		}
	}
};