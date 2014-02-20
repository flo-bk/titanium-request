var assert = require('assert');
var request = require('..');
var mockti = require('mockti');
var client = require('../lib/client');
var jsonFixture = require('./fixtures/responsejson');
var textFixture = require('./fixtures/responsetext');

client._ticlient = function () {
  var Ti = mockti();
  return Ti.Network.createHTTPClient();
};


describe('client', function () {

  describe('jobject()', function () {
    
    it('should retrieve json data from text', function () {
      var cli = client();
      cli.ticlient = jsonFixture;
      var jobject = cli.jobject();

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
      cli.ticlient = jsonFixture;
      var response = cli.response();

      assert.equal(jsonFixture.responseText, response.text);
      assert.equal(42, response.json.data[1]);
      assert.equal(200, response.code);
    });

    it('should return headers as json object', function () {
      var cli = client();
      cli.ticlient = jsonFixture;
      var response = cli.response();

      assert.equal('gws', response.headers['Server']);
    });

  });

});