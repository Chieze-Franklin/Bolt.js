'use strict';

var mongoose = require('mongoose');

var schemata = require("./schemata");

var appModel = mongoose.model('App', schemata.app);
var boltSecretModel = mongoose.model('BoltSecret', schemata.boltSecret);
var roleModel = mongoose.model('Role', schemata.role);
var userModel = mongoose.model('User', schemata.user);
var userRoleAssocModel = mongoose.model('UserRoleAssoc', schemata.userRoleAssoc);

module.exports = {
	app : appModel,
	boltSecret : boltSecretModel,
	role : roleModel,
	user : userModel,
	userRoleAssoc : userRoleAssocModel
};