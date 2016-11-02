var bodyParser = require('body-parser');
var express = require("express");
var path = require("path");

//-----------------handlers

var post_appstart_app = function(request, response){
	var context = request.body;

	var bolt_main = context.appInfo.bolt_main;
	var app = require(path.join('../../node_modules', context.path, bolt_main));
	var s = app.listen(0, function(){
		var port = s.address().port;
		context.pid = process.pid;
		context.port = port;
		response.send(context);
	});
}

//-----------------endpoints

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  res.set('Content-Type', 'application/json');
  next();
});

app.post('/app-start', post_appstart_app);

var server = app.listen(0, function(){
	var host = server.address().address;
	var port = server.address().port;

	process.stdout.write("app_host.port=" + port.toString());
});