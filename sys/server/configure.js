var config = require("bolt-internal-config");
var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var bodyParser = require('body-parser');
//var cons = require('consolidate');
var exphbs = require('express3-handlebars');
var express = require("express");
var path = require("path");
var session = require("client-sessions"/*"express-session"*/);

var __publicdir = path.join(__dirname + './../../public');
var __sysdir = path.join(__dirname + './../../sys');

module.exports = function(app) {
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));

	app.use(function (request, response, next) {
	  response.header('Access-Control-Allow-Origin', '*');
	  response.header('Access-Control-Allow-Headers', 
	  	'Origin, X-Requested-With, Content-Type, Accept, X-Bolt-Req-Id, X-Bolt-Locale, X-Bolt-API-Ver, X-Bolt-Perm-Token, X-Bolt-User-Token');
	  response.header('Access-Control-Allow-Methods', 'DELETE, GET, POST, PUT');

	  next();
	});

	app.use(session({
		cookieName: 'session',
		secret: config.getSessionSecret(),
		duration: 24 * 60 * 60 * 1000,
		activeDuration: 24 * 60 * 60 * 1000,
		//httpOnly: false

		/*saveUninitialized: true, 	//for express-session
		resave: true*/				//for express-session
	}));
	app.use(function(request, response, next) {
		if (!utils.Misc.isNullOrUndefined(request.session) && !utils.Misc.isNullOrUndefined(request.session.user)) {
			models.user.findOne({ name: request.session.user.name }, function(error, user) {
				if (!utils.Misc.isNullOrUndefined(user)) {
					if (user.isBlocked) { //TODO: test this
						request.session.reset();
					}
					else {
						request.user = utils.Misc.sanitizeUser(user);
						request.session.user = request.user;  //refresh the session value
						response.locals.user = request.user;  //make available to UI template engines
					}
				}
				next();
			});
		} 
		else {
			next();
		}
	});

	app.use('/api', function (request, response, next) {
	  response.set('Content-Type', 'application/json');
	  next();
	});

	app.use('/public', express.static(__publicdir));

	app.set('views', __sysdir + '/views');
	//app.engine('html', cons.handlebars);
	app.engine('html', exphbs.create({
		helpers: {
			json: function(obj) {
				return JSON.stringify(obj);
			}
		}
	}).engine);
	app.set('view engine', 'html');

	return app;
};