'use strict';

var crypto;
try {
 	crypto = require('crypto');
} catch (err) {
 	console.log('crypto support is disabled!');
}
var fs = require('fs')

module.exports = {
	Misc : {
		isNullOrUndefined: function(obj){
			return (typeof obj === 'undefined' || !obj);
		}
	},
	Security: {
		checksumSync: function(path, callback) {
			if (crypto) {
				var hash = crypto.createHash('sha256');
				var stream = fs.createReadStream(path);

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
				callback(null, path);
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