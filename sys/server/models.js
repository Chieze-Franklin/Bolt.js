'use strict';

var mongoose = require('mongoose');

var schemas = require("./schemas");

var userModel = mongoose.model('User', schemas.user);

module.exports = {
	user : userModel,
};