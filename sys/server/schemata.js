'use strict';

var mongoose = require('mongoose'), Schema = mongoose.Schema;

var defs = require("./defs");

var appSchema = new Schema(defs.app);
var boltSecretSchema = new Schema(defs.boltSecret);
var pluginSchema = new Schema(defs.plugin);
var roleSchema = new Schema(defs.role);
var userSchema = new Schema(defs.user);
//userSchema.statics.getRoles = function(){
//	userRoleSchema.find({ user_id: this._id }, { role_id: 1 });
//}
var userRoleAssocSchema = new Schema(defs.userRoleAssoc);

module.exports = {
	app : appSchema,
	boltSecret : boltSecretSchema,
	plugin : pluginSchema,
	role : roleSchema,
	user : userSchema,
	userRoleAssoc : userRoleAssocSchema
};