var assert = require('assert');
var request = require('..');
var mockti = require('mockti');
var client = require('../lib/client');
var errors = require('../lib/errors');
var jsonFixture = require('./fixtures/responsejson');
var textFixture = require('./fixtures/responsetext');

client.prototype._ticlient = function () {
  var Ti = mockti();
  return Ti.Network.createHTTPClient();
};

describe('client', function () {

  describe('jobject()', function () {
    
    it('should retrieve json data from text', function () {
      var cli = client();
      cli.ticlient = jsonFixture;
      var jobject = cli.jsonObject(textFixture);

      assert.equal(42, jobject.data[1]);
    });

    it('should return null if no JSON data is found', function () {
      var cli = client();
      var jobject = cli.jsonObject();

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

  describe('setheaders()', function () {

    it('should copy headers values', function () {
      var cli = client();
      cli.opt = {headers: {'Server': 'gws'}}
      cli.setheaders();

      assert.equal('gws', cli.ticlient.headers['Server']);
    });
  
  });

  describe('handlers', function () {

    it('should be called for each response', function (done) {

      var cli = client({handlers: [function () {
        done();
      }]});

      cli.ticlient = jsonFixture;
      cli.response();
    });

    it('should be called before each request', function (done) {

      var cli = client({handlers: [function () {
        done();
      }]});

      var noop = function () {};
      cli.ticlient = {
        open: noop,
        send: noop
      };

      cli.request({url: 'example.com', callback: noop});
    });

    it('should give access to client options', function (done) {

      var cli = client({bar: 'foo', handlers: [function (req) {
        assert.equal('bar', req.foo)
        assert.equal('foo', req.bar)
        done();
      }]});

      var noop = function () {};
      cli.ticlient = {
        open: noop,
        send: noop
      };

      cli.request({url: 'example.com', callback: noop, foo: 'bar'});
    });
  
  });

});
