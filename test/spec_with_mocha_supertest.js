var request = require('supertest');
//require = require('really-need');
describe('Loading Bolt...', function () {
  this.timeout(5000);

  var server;
  beforeEach(function () {
    delete require.cache[require.resolve('../bolt')]; //this makes sure it returns a new instance of the Bolt server, not a cached version
    server = require('../bolt');
    //server = require('./server', { bustCache: true });//this makes sure it returns a new instance of the Bolt server, not a cached version
  });
  afterEach(function (done) {
    server.close(done);
  });
  it('responds to /', function testSlash(done) {
  request(server)
    .get('/')
    .expect(302, done);
  });
  it('404 everything else', function testPath(done) {
    request(server)
      .get('/foo/bar')
      .expect(404, done);
  });
});