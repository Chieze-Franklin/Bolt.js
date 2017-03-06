//https://www.codementor.io/jhartikainen/how-to-unit-test-nodejs-http-requests-du107vbi0

var assert = require('assert');
var sinon = require('sinon');
var MockReq = require('mock-req');
var MockRes = require('mock-res');
var http = require('http');
 
var bolt = require('../bolt.js');
 
describe('bolt', function() {
  beforeEach(function() {
    this.request = sinon.stub(http, 'request');
  });
 
  afterEach(function() {
    http.request.restore();
  });
 
 
  //We will place our tests cases here
 
});