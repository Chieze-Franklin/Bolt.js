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
		displayName: { type: String, required: true },

		description: { type: String },
		dateCreated: { type: Date, default: Date.now },
		files: { type: Object},
		index: { type: String, default: '/' },
		ini: { type: String, default: '/' },
		install: { type: String, default: '/' },
		order: { type: Number, default: 0 },
		package: { type: Object, required: true },
		startup: { type: Boolean, default: false },
		system: { type: Boolean, default: false },
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
		features: { type: [String]},
		files: { type: [String]}
	},
	appUserAssoc : {
		app: { type: String, required: true },
		app_id: { type: ObjectId, required: true },
		user: { type: String, required: true },
		user_id: { type: ObjectId, required: true },

		dateCreated: { type: Date, default: Date.now },
		starts: { type: Number, default: 0 },
		lastStart: { type: Date, default: Date.now }
	},
	boltSecret : {
		name: { type: String, required: true, lowercase: true },
		value: { type: String, required: true }
	},
	extension : {
		path: { type: String, required: true },
		app: { type: String, required: true },
		isDefault: { type: Boolean, default: false },
		type: { type: String, required: true },
		route: { type: String, required: true }
	},
	role : {
		name: { type: String, required: true, lowercase: true },
		isAdmin: { type: Boolean, default: false },
		displayName: { type: String, required: true },

		description: { type: String },
		dateCreated: { type: Date, default: Date.now }
	},
	user : {
		name: { type: String, required: true, lowercase: true },
		displayName: { type: String, required: true },
		passwordHash : { type: String, required: true },

		displayPic: { type: String },
		email: { type: String },
		dateCreated: { type: Date, default: Date.now },
		isBlocked: { type: Boolean, default: false },
		lastVisit: { type: Date, default: Date.now },
		phone: { type: String },
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