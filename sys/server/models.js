'use strict';

var mongoose = require('mongoose');

var schemata = require("./schemata");

var userModel = mongoose.model('User', schemata.user);

module.exports = {
	user : userModel,
};