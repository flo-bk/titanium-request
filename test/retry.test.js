var assert = require('assert');
var request = require('..');
var client = require('../lib/client');
var retryMiddleware = require('../lib/middleware/retry');

describe('retryMiddleware', function () {
  var ticlientBackup = client.prototype._ticlient;

  beforeEach(function () {
    var noop = function () {};

    client.prototype._ticlient = function () {
      return {
        open: noop,
        send: noop
      }
    };
  });

  afterEach(function () {
    client.prototype._ticlient = ticlientBackup;
  });

  describe('timeout handler', function () {
    it('should call request 4 times and multiply timeout by 2 before each tryout', function (done) {
      var timeouts = [];
      var setTimeoutBackup = client.prototype.setTimeout;

      client.prototype.setTimeout = function (handler, timeout) {
        timeouts.push(timeout);
        handler();
      };

      var cli = client({
        handlers: [retryMiddleware({multiplier: 2, maxTryouts: 4})]
      });

      cli.request({url: 'example.com', timeout: 1, callback: function (err, res) {
        assert.deepEqual([1, 2, 4, 8], timeouts);
        client.prototype.setTimeout = setTimeoutBackup;
        done();
      }});
    });

    it('should call request 2 times and keep tryout value', function (done) {
      var timeouts = [];
      var setTimeoutBackup = client.prototype.setTimeout;

      client.prototype.setTimeout = function (handler, timeout) {
        timeouts.push(timeout);
        handler();
      };

      var cli = client({
        handlers: [retryMiddleware({multiplier: 1, maxTryouts: 2})]
      });

      cli.request({url: 'example.com', timeout: 1, callback: function (err, res) {
        assert.deepEqual([1, 1], timeouts);
        client.prototype.setTimeout = setTimeoutBackup;
        done();
      }});
    });

  });

});

