'use strict';

var crypto;
try {
 	crypto = require('crypto');
} catch (err) {
 	console.log('crypto support is disabled!');
}

module.exports = {
	Security: {
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