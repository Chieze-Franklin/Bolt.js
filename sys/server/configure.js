var models = require("bolt-internal-models");
var utils = require("bolt-internal-utils");

var AWS = require('aws-sdk');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var express = require("express");
var fs = require("fs");
var path = require("path");
var session = require("client-sessions"/*"express-session"*/);
var Showdown = require("showdown");
var s3 = require('s3');

var __publicdir = path.join(__dirname + './../../public');
var __sysdir = path.join(__dirname + './../../sys');

const X_BOLT_USER_TOKEN = 'X-Bolt-User-Token';
const X_BOLT_USER_NAME = 'X-Bolt-User-Name';

var multer = require('multer'), 
	upload = multer({ dest : 'public/bolt/uploads/'});

module.exports = function(app) {
	app.use(bodyParser.json({limit: '100mb'}));
	app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));

	app.use(function (request, response, next) {
	  response.header('Access-Control-Allow-Origin', '*');
	  response.header('Access-Control-Allow-Headers', 
	  	'Origin, X-Requested-With, Content-Type, Accept, X-Bolt-App-Token, X-Bolt-Locale, X-Bolt-API-Ver, X-Bolt-Perm-Token, X-Bolt-User-Token');
	  response.header('Access-Control-Allow-Methods', 'DELETE, GET, POST, PUT');

	  next();
	});

	app.use(session({
		cookieName: 'session',
		secret: process.env.BOLT_SESSION_SECRET,
		duration: 24 * 60 * 60 * 1000,
		activeDuration: 24 * 60 * 60 * 1000,
		//httpOnly: false

		/*saveUninitialized: true, 	//for express-session
		resave: true*/				//for express-session
	}));
	app.use(function(request, response, next) {
		if (!utils.Misc.isNullOrUndefined(request.get(X_BOLT_USER_NAME))) {
			var username = request.get(X_BOLT_USER_NAME);

			models.user.findOne({ 
				name: username
			}, function(error, user){
				if(!utils.Misc.isNullOrUndefined(user)){
					request.user = utils.Misc.sanitizeUser(user);
				}
				next();
			});
		}
		else if (!utils.Misc.isNullOrUndefined(request.get(X_BOLT_USER_TOKEN))) {
			var token = request.get(X_BOLT_USER_TOKEN);
			
			superagent
				.get(process.env.BOLT_ADDRESS + '/api/tokens/' + encodeURIComponent(token))
				.end(function(tokenError, tokenResponse){
					var realResponse = tokenResponse.body;
					if (!utils.Misc.isNullOrUndefined(realResponse) && !utils.Misc.isNullOrUndefined(realResponse.body)) {
						var userid = realResponse.body;
						models.user.findOne({ 
							_id: userid
						}, function(error, user){
							if(!utils.Misc.isNullOrUndefined(user)){
								request.user = utils.Misc.sanitizeUser(user);
							}
							next();
						});
					}
					else {
						next();
					}
				});
		}
		else if (!utils.Misc.isNullOrUndefined(request.session) && !utils.Misc.isNullOrUndefined(request.session.user)) {
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

	app.post('/public/upload', upload.any(), function (request, response) {
		var files = [];
		var results = [];
		var fileNames = [];
		
		if (!utils.Misc.isNullOrUndefined(request.file)) files.push(request.file);
		else if (!utils.Misc.isNullOrUndefined(request.files)) files = request.files;

		function loopThroughFiles (index) {
			if (index >= files.length) {
				response
					.set('Content-Type', 'application/json')
					.send(utils.Misc.createResponse(results));
				return;
			}

			var file = files[index];
			var fileName = "", filePath = "";

			function uploadToAWS(fileName, filePath) {
				var bucket = process.env.S3_BUCKET;
				var region = process.env.S3_REGION;

				AWS.config.update({ accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, 
					region: region });

				fs.readFile(filePath, function (err, data) {
					if (err) { 
						results.push({original: file.originalname, url: process.env.BOLT_ADDRESS + '/' + filePath, error: err});
						loopThroughFiles(index + 1);
						return; 
					}

					var base64data = new Buffer(data, 'binary');

					var s3 = new AWS.S3({signatureVersion: 'v4'});
					s3.putObject({
						Bucket: bucket,
						Key: fileName,
						Body: base64data,
						ACL: 'public-read'
					}, function (err, resp) {
						if (err) {
							//return the local file path (perhaps the user can retry)
							results.push({original: file.originalname, url: process.env.BOLT_ADDRESS + '/' + filePath, error: err});
							//fileNames.push(process.env.BOLT_ADDRESS + '/' + filePath);
						}
						else {
							results.push({original: file.originalname, url: 'https://s3.' + region + '.amazonaws.com/' + bucket + '/' + fileName});
							//fileNames.push('https://s3.' + region + '.amazonaws.com/' + bucket + '/' + fileName);
							fs.unlink(filePath, function(unlinkError){});
						}
						loopThroughFiles(index + 1);
					});

				});
			}

			//since multer seems not to add extensions, I'm doing it manually here
			var tempPath = path.resolve(file.path),
				targetPath = path.resolve(file.path + path.extname(file.originalname));
			fs.rename(tempPath, targetPath, function(renameError){
				//I can easily use targetPath (file.path + ext) but file.path uses '\' (instead of '/') as path separator, 
				//with which Mozilla doesn't work well sometimes
				if(!utils.Misc.isNullOrUndefined(renameError)) { //if the file could not be renamed just use the original name
					fileName = file.filename;
					filePath = file.destination + file.filename;
				}
				else {
					fileName = file.filename + path.extname(file.originalname);
					filePath = file.destination + file.filename + path.extname(file.originalname);
				}

				if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && 
					process.env.S3_BUCKET && process.env.S3_REGION) {
					uploadToAWS(fileName, filePath);
				}
				else {
					results.push({original: file.originalname, url: process.env.BOLT_ADDRESS + '/' + filePath});
					//fileNames.push(process.env.BOLT_ADDRESS + '/' + filePath);
					loopThroughFiles(index + 1);
				}
			});
		}

		loopThroughFiles(0);
	});

	app.delete('/public/upload/:file', function (request, response) {
		var filename = request.params.file;

		//delete local copy
		fs.unlink(path.resolve('public/bolt/uploads/' + filename), function(unlinkError){});

		//delete AWS S3 copy
		if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && 
			process.env.S3_BUCKET && process.env.S3_REGION) {
			var bucket = process.env.S3_BUCKET;
			var region = process.env.S3_REGION;

			AWS.config.update({ accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, 
				region: region });

			var s3 = new AWS.S3();

			var params = {
				Bucket: bucket, 
				Delete: {
					Objects: [
						{
							Key: filename
						}
					]
				}
			};

			s3.deleteObjects(params, function(err, data) {
				//if (err) console.log(err, err.stack); // an error occurred
				//else     console.log(data);           // successful response
			});
		}

		response
			.set('Content-Type', 'application/json')
			.send(JSON.stringify({}));
	});

	app.use('**/public', express.static(__publicdir));

	app.set('views', __sysdir + '/views');
	app.engine('html', exphbs.create({
		defaultLayout: 'main.html',
		layoutsDir: app.get('views') + '/layouts',
		partialsDir: [app.get('views') + '/partials'],
		helpers: {
			markdownToHtml: function(obj) {
				if (!obj) return "";
				
				var converter;
				try{
					converter = new Showdown.converter(); //lowercase 'C'
				}
				catch (e) {
					converter = new Showdown.Converter(); //uppercase 'C'
				}
				var content = converter.makeHtml(obj);
				return content;
			},
			markdownToHtmlString: function(obj) {
				if (!obj) return "";

				var converter;
				try{
					converter = new Showdown.converter(); //lowercase 'C'
				}
				catch (e) {
					converter = new Showdown.Converter(); //uppercase 'C'
				}
				var content = converter.makeHtml(obj);
				content = content;
				content = content.split("\n");
				content = content.join();
				content = content.split("'");
				content = content.join("\"");
				return content;
			},
			json: function(obj) {
				return JSON.stringify(obj);
			}
		}
	}).engine);
	app.set('view engine', 'html');

	return app;
};