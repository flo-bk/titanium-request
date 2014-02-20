var assert = require('assert');
var request = require('..');
var mockti = require('mockti');
var client = require('../lib/client');
var jsonFixture = require('./fixtures/responsejson');
var textFixture = require('./fixtures/responsetext');

client.ticlient = function (options) {
  var Ti = mockti();
  return Ti.Network.createHTTPClient(options);
};


describe('client', function () {

  describe('jobject()', function () {
    
    it('should retrieve json data from text', function () {
      var cli = client();
      var jobject = cli.jobject(jsonFixture);

      assert.equal(42, jobject.data[1]);
    });

    it('should return null if no JSON data is found', function () {
      var cli = client();
      var jobject = cli.jobject(textFixture);

      assert.equal(null, jobject);
    });

  });

  describe('response()', function () {

    it('should retrieve text json and code', function () {
      var cli = client();
      var response = cli.response(jsonFixture);

      assert.equal(jsonFixture.responseText, response.text);
      assert.equal(42, response.json.data[1]);
      assert.equal(200, response.code);
    });

    it('should return headers', function () {
      var cli = client();
      var response = cli.response(jsonFixture);

      assert.equal('foobar=42', response.headers['set-cookie']);
    });

  });

});