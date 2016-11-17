'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

module.exports = {
	app : {
		appHash: { type: String },
		name: { type: String, required: true, lowercase: true },
		path: { type: String, required: true },
		main: { type: String },
		title: { type: String, required: true },

		description: { type: String },
		dateCreated: { type: Date, default: Date.now },
		files: { type: Object},
		icon: { type: String },
		index: { type: String, default: '/' },
		ini: { type: String, default: '/' },
		install: { type: String, default: '/' },
		package: { type: Object, required: true },
		startup: { type: Boolean, default: false },
		tags: { type: [String]},
		version: { type: String }
	},
	appRoleAssoc : {
		app: { type: String, required: true },
		app_id: { type: ObjectId, required: true },
		role: { type: String, required: true },
		role_id: { type: ObjectId, required: true },
		start: { type: Boolean, required: true, },

		dateCreated: { type: Date, default: Date.now },
		features: { type: [String]}
	},
	boltSecret : {
		name: { type: String, required: true },
		value: { type: String, required: true }
	},
	plugin : {
		path: { type: String, required: true },
		app: { type: String, required: true },
		isDefault: { type: Boolean, default: false },
		endpoint: { type: String, required: true }
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

		isBlocked: { type: Boolean, default: false },
		dateCreated: { type: Date, default: Date.now },
		visits: { type: Number, default: 0 }
	},
	userRoleAssoc : {
		role: { type: String, required: true },
		role_id: { type: ObjectId, required: true },
		user: { type: String, required: true },
		user_id: { type: ObjectId, required: true },
		dateCreated: { type: Date, default: Date.now }
	}
};