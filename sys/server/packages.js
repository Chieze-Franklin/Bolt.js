'use strict';

var fs = require("fs");
var path = require("path");

var __pckgs;
var getPackages = function(){
	if(__pckgs) return __pckgs;

	var data = fs.readFileSync(path.join(__dirname, 'packages.json')); //deliberately reading the file sync
	__pckgs = JSON.parse(data);
	return __pckgs;
}

module.exports = {
	getAppPath : function(name){
		var p = getPackages();
		for (var i = 0; i < p.apps.length; i++) {
			var entry = p.apps[i]
			if(entry.name === name){
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
				if(entry.path){ //if there is a default app, return it as the only element of the array
					var paths = [];
					paths.push(entry.path);
					return paths;
				}

				return entry.paths;
			}
		}
	}
};