/*
 * Dependencies 
 */

var client = require('./lib/client');
var inproxy = require('./lib/inproxy');
var settings = require('./lib/settings');
var errors = require('./lib/errors');
var middlewares = {
  cookie: require('./lib/middleware/cookie')
};


/* Void callback */

var noop = function () {};
var handlers = [];
var request = module.exports = {};


request.setup = function (url, callback, options, method) {
  options = options || {};
  options.url = url;
  options.callback = callback || noop;
  options.method = method;
  options.handlers = handlers;

  return options;
};

/*
 * @api
 * Proceed an HTTP request with GET method
 */

request.get = function (url, callback, options) {
  client().request(request.setup(url, callback, options, 'GET'));
};


/*
 * @api
 * Proceed an HTTP request with POST method
 */

request.post = function (url, callback, options) {
  client().request(request.setup(url, callback, options, 'POST'));
};


/*
 * @api
 * Proceed an HTTP request with PUT method
 */

request.put = function (url, callback, options) {
  client().request(request.setup(url, callback, options, 'PUT'));
};


/*
 * @api
 * Proceed an HTTP request with DELETE method
 */

request.delete = function (url, callback, options) {
  client().request(request.setup(url, callback, options, 'DELETE'));
};

/*
 * @api
 * Adds middleware for requests and reponses
 */

request.use = function (handler) {
  handlers.push(handler);
};

/*
 * @api
 * Set/Get global config
 */

request.config = {
  set: function (name, value) {
    settings[name] = value;
  },

  get: function (name, def) {
    return settings[name] || def;
  }
};

/*
 * @api
 * Register a proxy as a url/path event
 */

request.on = function (path, handler) {
  inproxy.registerProxy(path, handler);
};

/*
 * Export lib native middlewares
 */

request.middlewares = middlewares;

/*
 * Make the errors lib accessible
 */

request.errors = errors;
