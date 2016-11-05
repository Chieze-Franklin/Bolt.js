'use strict';

var mongoose = require('mongoose'), Schema = mongoose.Schema;

var defs = require("./defs");

var boltSecretSchema = new Schema(defs.boltSecret);

var roleSchema = new Schema(defs.role);

var userSchema = new Schema(defs.user);
//userSchema.statics.getRoles = function(){
//	userRoleSchema.find({ user_id: this._id }, { role_id: 1 });
//}

var userRoleSchema = new Schema(defs.userRole);

module.exports = {
	boltSecret : boltSecretSchema,
	role : roleSchema,
	user : userSchema,
	userRole : userRoleSchema
};