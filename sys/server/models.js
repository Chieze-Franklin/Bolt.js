'use strict';

var mongoose = require('mongoose');

var schemata = require("./schemata");

var boltSecretModel = mongoose.model('BoltSecret', schemata.boltSecret);

var userModel = mongoose.model('User', schemata.user);

module.exports = {
	boltSecret : boltSecretModel,
	user : userModel
};