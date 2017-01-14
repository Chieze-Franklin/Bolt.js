'use strict';

var mongoose = require('mongoose');

var schemata = require("./schemata");

var appModel = mongoose.model('App', schemata.app);
var appRoleAssocModel = mongoose.model('AppRoleAssoc', schemata.appRoleAssoc);
var appUserAssocModel = mongoose.model('AppUserAssoc', schemata.appUserAssoc);
var boltSecretModel = mongoose.model('BoltSecret', schemata.boltSecret);
var collectionModel = mongoose.model('Collection', schemata.collection);
var extensionModel = mongoose.model('Extension', schemata.extension);
var roleModel = mongoose.model('Role', schemata.role);
var routerModel = mongoose.model('Router', schemata.router);
var userModel = mongoose.model('User', schemata.user);
var userRoleAssocModel = mongoose.model('UserRoleAssoc', schemata.userRoleAssoc);

module.exports = {
	app : appModel,
	appRoleAssoc : appRoleAssocModel,
	appUserAssoc : appUserAssocModel,
	boltSecret : boltSecretModel,
	collection: collectionModel,
	extension: extensionModel,
	role : roleModel,
	router: routerModel,
	user : userModel,
	userRoleAssoc : userRoleAssocModel
};