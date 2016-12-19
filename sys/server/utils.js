var crypto;
try {
 	crypto = require('crypto');
} catch (err) {
 	console.log('crypto support is disabled!');
}
var fs = require('fs')
var path = require("path");

var errors = require("./errors");

var __isNullOrUndefined = function(obj){
	return (typeof obj === 'undefined' || obj === null);
}

var __extractModel = function(model, propsToGet) {
	var _model = model;
	if(!__isNullOrUndefined(model) && !__isNullOrUndefined(model.toJSON)) _model = model.toJSON();
	var _object = {};
	for (var prop in _model) {
		if (_model.hasOwnProperty(prop)) {
			if(propsToGet.indexOf(prop) != -1) {
				_object[prop] = _model[prop];
			}
		}
	}
	return _object;
}

var __sanitizeModel = function(model, propsToRemove) {
	var _model = model;
	if(!__isNullOrUndefined(model) && !__isNullOrUndefined(model.toJSON)) _model = model.toJSON();
	propsToRemove.forEach(function(prop){
		delete _model[prop];
	});
	return _model;
},
__sanitizeModels = function(models, propsToRemove) {
	var _models = [];
	models.forEach(function(model){
		_models.push(__sanitizeModel(model, propsToRemove));
	});
	return _models;
},

__sanitizeRole = function(model) {
	return __sanitizeModel(model, ['__v']);
},
__sanitizeRoles = function(models) {
	var _models = [];
	models.forEach(function(model){
		_models.push(__sanitizeRole(model));
	});
	return _models;
},
__sanitizeUser = function(model) {
	return __sanitizeModel(model, ['__v', 'passwordHash']);
},
__sanitizeUsers = function(models) {
	var _models = [];
	models.forEach(function(model){
		_models.push(__sanitizeUser(model));
	});
	return _models;
},
__sanitizeUserRole = function(model) {
	return __sanitizeModel(model, ['__v']);
},
__sanitizeUserRoles = function(models) {
	var _models = [];
	models.forEach(function(model){
		_models.push(__sanitizeUserRole(model));
	});
	return _models;
};

module.exports = {
	Misc : {
		//constructs an appropriate response object
		createResponse: function(body, error, code, errorTraceId, errorUserTitle, errorUserMessage){
			//TODO: support errorTraceId
			//TODO: errorUserTitle and errorUserMessage should be change from strings to ints (==code) to support localization

			var response = {};

			//set code
			if (!__isNullOrUndefined(code)) {
				response.code = code;
			}
			else {
				if (!__isNullOrUndefined(body))
					response.code = 0;
				else if (!__isNullOrUndefined(error))
					response.code = 1000;
			}

			//set body
			if (!__isNullOrUndefined(body))
				response.body = body;

			//set error
			if (!__isNullOrUndefined(error)){
				response.error = error;

				//set errorTraceId
				if (!__isNullOrUndefined(errorTraceId))
					response.errorTraceId = errorTraceId;

				//set errorUserTitle
				if (!__isNullOrUndefined(errorUserTitle))
					response.errorUserTitle = errorUserTitle; //TODO: this is not the real implementation
				else {
					//TODO: this is not the real implementation
					response.errorUserTitle = response.code;
				}

				//set errorUserMessage
				if (!__isNullOrUndefined(errorUserMessage))
					response.errorUserMessage = errorUserMessage; //TODO: this is not the real implementation
				else {
					//TODO: this is not the real implementation
					response.errorUserMessage = errors[response.code];
				}
			}

			return JSON.stringify(response);
		},
		extractModel: __extractModel,
		sanitizeModel: __sanitizeModel,
		sanitizeModels: __sanitizeModels,
		sanitizeRole: __sanitizeRole,
		sanitizeRoles: __sanitizeRoles,
		sanitizeUser: __sanitizeUser,
		sanitizeUsers: __sanitizeUsers,
		sanitizeUserRole: __sanitizeUserRole,
		sanitizeUserRoles: __sanitizeUserRoles,
		isNullOrUndefined: __isNullOrUndefined
	},
	Security: {
		checksumSync: function(_path, callback) {
			if (!__isNullOrUndefined(crypto)) {
				var hash = crypto.createHash('sha256');
				var stream = fs.createReadStream(_path);

				stream.on('error', function(error){
					callback(error, null);
				});

				stream.on('data', function(data){
					hash.update(data, 'utf8');
				});

				stream.on('end', function(data){
					var hsh = hash.digest('hex');
					callback(null, hsh);
				});
			}
			else {
				callback(null, _path);
			}
		},
		hashSync: function(word, salt){
			if(!salt)
				salt = word;

			if(crypto){
				//return crypto.createHash('sha256').update(word).digest('hex');
				return crypto.createHmac('sha512', salt).update(word).digest('hex');
			}
			else
				return word;
		}
	},
	String: {
		getRandomString: function(length){
			if(crypto) {
				return crypto.randomBytes(Math.ceil(length / 2))
		            .toString('hex') /** convert to hexadecimal format */
		            .slice(0, length);   /** return required number of characters */
			}
			else {
				return Date.now.toString();
			}
		},
		startsWith: function(word, chars, start){
			if (__isNullOrUndefined(start)) start = 0;
			return word.indexOf(chars) == start;
		},
		trim: function(word, char){
			return this.trimStart(this.trimEnd(word, char), char);
		},
		trimEnd: function(word, char){
			if(!char)
				char = " ";

			for(var i = (word.length - 1); word.charAt(i) == char && i > -1; --i)
				word = word.substring(0, i);

			return word;
		},
		trimStart: function(word, char){
			if(!char)
				char = " ";

			for(var i = 0; word.charAt(i) == char && i < word.length; )
				word = word.substring(i + 1);

			return word;
		}
	}
};