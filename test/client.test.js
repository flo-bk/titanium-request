var assert = require('assert');
var request = require('..');
var mockti = require('mockti');
var client = require('../lib/client');
var errors = require('../lib/errors');
var jsonFixture = require('./fixtures/responsejson');
var textFixture = require('./fixtures/responsetext');


describe('client', function () {

  var ticlientBackup = client.prototype.getHTTPClient;
  var isOnlineBackup = client.prototype.isOnline;

  beforeEach(function () {
    var noop = function () {};

    client.prototype.getHTTPClient = function () {
      var Ti = mockti();
      return Ti.Network.createHTTPClient();
    };

    client.prototype.isOnline = function () {
      return true;
    };
  });

  afterEach(function () {
    client.prototype.getHTTPClient = ticlientBackup;
    client.prototype.isOnline = isOnlineBackup;
  });


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

  describe('setHeaders()', function () {

    it('should copy headers values', function () {
      var cli = client();
      cli.opt = {headers: {'Server': 'gws'}};
      cli.setHeaders();

      assert.equal('gws', cli.opt.headers['Server']);
    });
  
  });

  describe('handlers', function () {

    it('should be called for each response', function (done) {

      var cli = client({
        handlers: [
          function () {
            done();
          }
        ],
        callback: function noop() {}
      });

      cli.ticlient = jsonFixture;
      cli.handleResponse();
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

    it('stop chain 2 handlers', function (done) {
      var callCount = 0;
      var cli = client({
        handlers: [
          function firstHandler() {
            callCount++;
          },
          function secondHandler() {
            callCount++;
          }
        ],
        callback: function noop() {},
        url: 'example.com'
      });

      var noop = function () {};
      cli.ticlient = {
        open: noop,
        send: noop
      };

      cli.request({url: 'example.com', callback: noop});

      assert.equal(2, callCount);
      done();
    });

    it('stop chaining to next handler if previous returned false', function (done) {
      var callCount = 0;
      var cli = client({
        handlers: [
          function firstHandler() {
            callCount++;
            return false;
          },
          function secondHandler() {
            callCount++;
          }
        ],
        callback: function noop() {},
        url: 'example.com'
      });

      var noop = function () {};
      cli.ticlient = {
        open: noop,
        send: noop
      };

      cli.request({url: 'example.com', callback: noop});

      assert.equal(1, callCount);
      done();
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

  describe('timeout handler', function () {
    it('should send a timeout error', function (done) {
      var cli = client();
      var noop = function () {};

      cli.ticlient = {
        open: noop,
        send: noop
      };

      cli.request({url: 'example.com', timeout: 1, callback: function (err, res) {
        assert.equal(true, err instanceof errors.TimeoutError);
        done();
      }});
    });

    it('should send a NoNetworkError if no network found', function (done) {
      var cli = client();
      var noop = function () {};

      cli.ticlient = {
        open: noop,
        send: noop
      };

      cli.isOnline = function () {
        return false;
      };

      cli.request({url: 'example.com', timeout: 1, callback: function (err, res) {
        assert.equal(true, err instanceof errors.NoNetworkError);
        done();
      }});
    });

  });

});
