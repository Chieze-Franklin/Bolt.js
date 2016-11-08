'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

module.exports = {
	app : {
		appHash: { type: String },
		name: { type: String, required: true, lowercase: true },
		path: { type: String, required: true },
		//secretHash: { type: String, required: true },

		description: { type: String },
		dateCreated: { type: Date, default: Date.now },
		startup: { type: Boolean, default: false },
		tags: { type: [String]},
		version: { type: Number }
	},
	appRoleAssoc : {
		app: { type: String, required: true },
		app_id: { type: ObjectId, required: true },
		role: { type: String, required: true },
		role_id: { type: ObjectId, required: true },

		dateCreated: { type: Date, default: Date.now },
		permissions: { type: [String]}
	},
	boltSecret : {
		name: { type: String, required: true },
		value: { type: String, required: true }
	},
	role : {
		name: { type: String, required: true },
		isAdmin: { type: Boolean, default: false },

		description: { type: String },
		dateCreated: { type: Date, default: Date.now }
	},
	user : {
		username: { type: String, required: true, lowercase: true },
		passwordHash : { type: String, required: true },

		blocked: { type: Boolean, default: false },
		dateCreated: { type: Date, default: Date.now },
		visits: { type: Number, default: 0 }
	},
	userRoleAssoc : {
		role: { type: String, required: true },
		role_id: { type: ObjectId, required: true },
		user: { type: String, required: true },
		user_id: { type: ObjectId, required: true },
		dateCreated: { type: Date, default: Date.now }
	},
	viewDelegate : {
		name: { type: String, required: true },
		app: { type: String, required: true },
		app_id: { type: ObjectId, required: true },
		apps: { type: [String] },
		app_ids: { type: [ObjectId] }
	}
};