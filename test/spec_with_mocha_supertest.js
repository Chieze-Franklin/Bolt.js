var request = require('supertest');
describe('Loading Bolt...', function () {
  this.timeout(8000);

  var server;
  beforeEach(function () {
    server = require('../bolt');
  });
  afterEach(function () {
    server.close();
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