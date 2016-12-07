'use strict';

var mongoose = require('mongoose');

var schemata = require("./schemata");

var appModel = mongoose.model('App', schemata.app);
var appRoleAssocModel = mongoose.model('AppRoleAssoc', schemata.appRoleAssoc);
var appUserAssocModel = mongoose.model('AppUserAssoc', schemata.appUserAssoc);
var boltSecretModel = mongoose.model('BoltSecret', schemata.boltSecret);
var pluginModel = mongoose.model('Plugin', schemata.plugin);
var roleModel = mongoose.model('Role', schemata.role);
var userModel = mongoose.model('User', schemata.user);
var userRoleAssocModel = mongoose.model('UserRoleAssoc', schemata.userRoleAssoc);

module.exports = {
	app : appModel,
	appRoleAssoc : appRoleAssocModel,
	appUserAssoc : appUserAssocModel,
	boltSecret : boltSecretModel,
	plugin: pluginModel,
	role : roleModel,
	user : userModel,
	userRoleAssoc : userRoleAssocModel
};