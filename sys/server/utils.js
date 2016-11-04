'use strict';

var crypto;
try {
 	crypto = require('crypto');
} catch (err) {
 	console.log('crypto support is disabled!');
}

module.exports = {
	Security : {
		hashSync: function(word){
			if(crypto)
				return crypto.createHash('sha256').update(word).digest('hex');
			else
				return word;
		}
	}
};