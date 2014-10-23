'use strict';

/*
 * Dependencies
 */

var bindAll = require('bindall-standalone');
var queryString = require('query-string');
var extend = require('extend');
var inproxy = require('./inproxy');
var settings = require('./settings');
var errors = require('./errors');


/*
 * Exports Client constructor
 */

var Client = module.exports = function (options) {
  if (!(this instanceof Client)) return new Client(options);

  bindAll(this);
  this.ticlient = this._ticlient();
  this.opt = extend({
    handlers: [],
    headers: {}
  }, settings, options || {});
};

/* Simple Titanium HTTPClient constructor */

Client.prototype._ticlient = function () {
  return Ti.Network.createHTTPClient();
};

/*
 * Local Referencies
 */

var client = Client.prototype;


/* HTTP request factory */

client.request = function (options) {
  var that = this;
  var url;
  var query;

  this.opt = extend(this.opt, options);

  this.runHandlers(this.opt, null, null, function () {
    url = that.opt.url;
    query = queryString.stringify(that.opt.query || {});

    if (query.length > 0) url += '?' + query;
    if (that.opt.debug) console.log(that.opt.method, url);

    // Make sure ticlient won't get the timeout before us
    that.ticlient.timeout = that.opt.timeout * 100;
    that.ticlient.onerror = that.handleResponse;
    that.ticlient.onload = that.handlePartialResponse(null);
    that.timeoutid = this.setTimeout(function () {
      that.handleResponse(new errors.TimeoutError());
    }, that.opt.timeout);
    that.ticlient.open(that.opt.method, url, true);
    that.setheaders();
    inproxy.passThroughProxy(url, that);
  });
};

/* setTimeout wrapper (help tests) */

client.setTimeout = function (handler, timeout) {
  return setTimeout(handler, timeout);
};

/* Chain handlers and callback, if every handlers returned anything but false */

client.runHandlers = function (req, res, err, callback) {
  var status = this.opt.handlers.every(function (handler) {
    return handler(req, res, err) !== false;
  });

  if (status === true) callback.apply(this, [err, res]);
};

/*
 * Call preconfigured Ti HTTPClient request,
 * and forward response to callback parameter
 */

client.call = function (callback) {
  var callbackBackup = this.opt.callback;
  var that = this;

  this.opt.callback = function (err, res) {
    that.opt.callback = callbackBackup;
    callback.apply(that, [err, res]);
  };

  this.ticlient.send(this.opt.body);
};

/* Send response parameter to callback */

client.send = function (err, res) {
  this.opt.callback(!!err ? err : null, !!err ? null : res);
};

/* Set headers from options.headers object */

client.setheaders = function () {
  var that = this;

  Object.keys(this.opt.headers || {}).forEach(function (name) {
    that.ticlient.setRequestHeader(name, that.opt.headers[name]);
  });
};

/* Return a response handler that can be called only once */

client.handleResponse = function (err) {
  var that = this;
  var res = that.response(that.ticlient);

  clearTimeout(that.timeoutid);
  if (this.responseHandled) return false;

  this.responseHandled = true;
  this.runHandlers(this.opt, res, err, this.send);
};

/* Call handleResponse and force error argument */

client.handlePartialResponse = function (forced) {
  var that = this;

  return function (err) {
    that.handleResponse(forced);
  };
};

/* Try to parse text response with JSON, returns null on error */

client.jsonObject = function () {
  var jsonObject = null;

  try {
    jsonObject = JSON.parse(this.ticlient.responseText);
  } catch (err) {
    if (this.opt.debug) console.log(err);
  }

  return jsonObject;
};

/* Try to parse text response with XML, returns null on error */

client.xmlObject = function () {
  var xmlObject = null;

  try {
    xmlObject = this.ticlient.responseXML;
  } catch (err) {
    if (this.opt.debug) console.log(err);
  }

  return xmlObject;
};


/* Split a raw paragraph to build a corresponding object */

client.splitobj = function (raw) {
  var obj = {};

  raw.split('\n').forEach(function (line) {
    var matchLine, matchName, matchValue;

    matchLine = line.match(/([^\:]*)\:(.*)/);
    if (!matchLine) return;

    matchName = matchLine[1].match(/\s*([^\s]{1}.*[^\s]{1})\s*/);
    if (!matchName) return;

    matchValue = matchLine[2].match(/\s*([^\s]{1}.*[^\s]{1})\s*/);
    if (!matchValue) return;

    obj[matchName[1]] = (obj[matchName[1]] || '') + matchValue[1];
  });

  return obj;
};

/* Returns response headers as JSON object */

client.headers = function () {
  var headers = {};
  var raw = null;

  if (!!this.ticlient.getResponseHeaders) {
    return this.ticlient.getResponseHeaders() || {};
  }

  if (!this.ticlient.getAllResponseHeaders) return {};

  return this.splitobj(this.ticlient.getAllResponseHeaders());
};

/* Response object factory */

client.response = function () {
  return {
    code: this.ticlient.status,
    xml: this.xmlObject(),
    blob: this.ticlient.responseData,
    text: this.ticlient.responseText,
    json: this.jsonObject(),
    headers: this.headers()
  };
};
