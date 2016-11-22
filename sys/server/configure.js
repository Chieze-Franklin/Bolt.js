var bodyParser = require('body-parser');
var cons = require('consolidate');
var express = require("express");
var path = require("path");
var session = require("client-sessions"/*"express-session"*/);

var config = require("./config");
var models = require("./models");
var utils = require("./utils");

var __sysdir = path.join(__dirname + './../../sys');

module.exports = function(app) {
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));

	app.use(function (request, response, next) {
	  response.header('Access-Control-Allow-Origin', '*');
	  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

	  next();
	});

	app.use(session({
		cookieName: 'session',
		secret: config.getSessionSecret(),
		duration: 24 * 60 * 60 * 1000,
		activeDuration: 24 * 60 * 60 * 1000

		/*saveUninitialized: true, 	//for express-session
		resave: true*/				//for express-session
	}));
	app.use(function(request, response, next) {
		if (!utils.Misc.isNullOrUndefined(request.session) && !utils.Misc.isNullOrUndefined(request.session.user)) {
			models.user.findOne({ username: request.session.user.username }, function(error, user) {
				if (!utils.Misc.isNullOrUndefined(user)) {
					if (user.isBlocked) { //TODO: test this
						request.session.reset();
					}
					else {
						delete user.passwordHash; // delete the password from the session
						request.user = user;
						request.session.user = user;  //refresh the session value
						response.locals.user = user;  //make available to UI template engines
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

	app.use('/assets', express.static(__sysdir + '/views/assets'));
	app.use('/pages', express.static(__sysdir + '/views/pages'));
	app.use('/client', express.static(__sysdir + '/client'));

	app.set('views', __sysdir + '/views');
	app.engine('html', cons.handlebars);
	app.set('view engine', 'html');

	return app;
};