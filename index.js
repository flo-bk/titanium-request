/*
 * Dependencies 
 */

var client = require('./lib/client');
var settings = require('./lib/settings');

/* Void callback */

var noop = function () {};


/*
 * @api
 * Proceed an HTTP request with GET method
 */

exports.get = function (url, callback, options) {
  options = options || {};
  options.url = url;
  options.callback = callback;
  options.method = 'GET';

  client().request(options);
};


/*
 * @api
 * Proceed an HTTP request with POST method
 */

exports.post = function (url, data, callback, options) {
  options = options || {};
  options.url = url;
  options.callback = callback;
  options.data = data;
  options.method = 'POST';

  client().request(options);
};


/*
 * @api
 * Proceed an HTTP request with PUT method
 */

exports.put = function (url, data, callback, options) {
  options = options || {};
  options.url = url;
  options.callback = callback;
  options.data = data;
  options.method = 'PUT';

  client().request(options);
};


/*
 * @api
 * Proceed an HTTP request with DELETE method
 */

exports.delete = function (url, callback, options) {
  options = options || {};
  options.url = url;
  options.callback = callback;
  options.method = 'PUT';

  client().request(options);
};

/*
 * @api
 * Change one settings variable
 */

exports.set = function (name, value) {
  settings[name] = value;
};
