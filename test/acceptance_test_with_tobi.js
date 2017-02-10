var tobi = require('tobi');
var server = require('../bolt');
var browser = tobi.createBrowser(server);

browser.get('/', function (res, $) {
  res.should.have.status(200);
  server.close();
})