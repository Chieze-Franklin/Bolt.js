var soda = require('soda');
var assert = require('assert');
//var server = require('../bolt');
var browser = soda.createClient({
	host: '127.0.0.1',
	port: 400,
	url: 'http://localhost:400',
	browser: 'firefox'
});

browser.on('command', function(cmd, args){
	console.log(cmd, args.join(', '));
});

browser
	.chain
	.session()
	.open('/login')
	.type('username', 'frank')
	.type('password', '1234')
	.clickAndWait('submit')
	.assertTextPresent('home')
	.testComplete()
	.end(function(error){
		if(error) console.log(error);
		console.log('Done!');
	});