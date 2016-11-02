'use strict';

var mongoose = require('mongoose'), Schema = mongoose.Schema;

var defs = require("./defs");

var userSchema = new Schema(defs.user);

module.exports = {
	user : userSchema
};