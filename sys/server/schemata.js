'use strict';

var mongoose = require('mongoose'), Schema = mongoose.Schema;

var defs = require("./defs");

var appSchema = new Schema(defs.app);
var appRoleAssocSchema = new Schema(defs.appRoleAssoc);
var appUserAssocSchema = new Schema(defs.appUserAssoc);
var boltSecretSchema = new Schema(defs.boltSecret);
var collectionSchema = new Schema(defs.collection);
var extensionSchema = new Schema(defs.extension);
var roleSchema = new Schema(defs.role);
var routerSchema = new Schema(defs.router);

var userSchema = new Schema(defs.user);
userSchema.virtual('dn')
	.get(function(){ return this.displayName; })
	.set(function(dn){ this.displayName = dn; });
userSchema.virtual('dp')
	.get(function(){ return this.displayPic; })
	.set(function(dp){ this.displayPic = dp; });
//userSchema.statics.getRoles = function(){
//	userRoleSchema.find({ user_id: this._id }, { role_id: 1 });
//}

var userRoleAssocSchema = new Schema(defs.userRoleAssoc);

module.exports = {
	app : appSchema,
	appRoleAssoc : appRoleAssocSchema,
	appUserAssoc : appUserAssocSchema,
	boltSecret : boltSecretSchema,
	collection : collectionSchema,
	extension : extensionSchema,
	role : roleSchema,
	router : routerSchema,
	user : userSchema,
	userRoleAssoc : userRoleAssocSchema
};