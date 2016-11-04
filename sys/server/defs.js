'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

module.exports = {
	role : {
		name: { type: String, required: true },

		dateCreated: { type: Date, default: Date.now }
	},
	user : {
		username: { type: String, required: true },
		passwordHash : { type: String, required: true },

		blocked: { type: Boolean, default: false },
		dateCreated: { type: Date, default: Date.now },
		visits: { type: Number, default: 0 }
	},
	userRole : {
		role_id: { type: ObjectId, required: true },
		user_id: { type: ObjectId, required: true },
		dateCreated: { type: Date, default: Date.now },
		visits: { type: Number }
	},
};