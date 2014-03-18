/*
 * Dependencies 
 */

var queryString = require('query-string');
var client = require('./lib/client');
var settings = require('./lib/settings');

/* Void callback */

var noop = function () {};
var handlers = [];

/*
 * @api
 * Proceed an HTTP request with GET method
 */

exports.get = function (url, callback, data, options) {
  var query = queryString.stringify(data);

  options = options || {};
  options.url = url + (!!query ? '?' + query : '');
  options.callback = callback || noop;
  options.method = 'GET';
  options.handlers = handlers;

  client().request(options);
};


/*
 * @api
 * Proceed an HTTP request with POST method
 */

exports.post = function (url, callback, data, options) {
  options = options || {};
  options.url = url;
  options.callback = callback || noop;
  options.data = data;
  options.method = 'POST';
  options.handlers = handlers;

  client().request(options);
};


/*
 * @api
 * Proceed an HTTP request with PUT method
 */

exports.put = function (url, callback, data, options) {
  options = options || {};
  options.url = url;
  options.callback = callback || noop;
  options.data = data;
  options.method = 'PUT';
  options.handlers = handlers;

  client().request(options);
};


/*
 * @api
 * Proceed an HTTP request with DELETE method
 */

exports.delete = function (url, callback, data, options) {
  options = options || {};
  options.url = url;
  options.callback = callback || noop;
  options.data = data;
  options.method = 'DELETE';
  options.handlers = handlers;

  client().request(options);
};

/*
 * @api
 * Adds middleware for requests and reponses
 */

exports.use = function (handler) {
  handlers.push(handler);
};

/*
 * @api
 * Change one settings variable
 */

exports.set = function (name, value) {
  settings[name] = value;
};
