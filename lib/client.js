'use strict';

var cookie = require('./cookie');
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

  this.ticlient = (this._ticlient || options._ticlient)();
  this.opt = extend({
    handlers: [],
    headers: {},
    retryEnabled: settings.retryEnabled,
    timeout: settings.timeout,
    retryTryouts: settings.retryTryouts
  }, options || {});
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
  var query = queryString.stringify(options.query || {});
  
  if (query.length > 0) options.url += '?' + query;
  
  this.opt = extend(this.opt, options);
  cookie.extend(options.url, options.headers);
  this.opt.handlers.forEach(function (handler) {
    handler(that.opt, null);
  });

  if (this.opt.debug) console.log(this.opt.method, this.opt.url);

  this.ticlient.ontimeout = this.timeoutcb(this.opt);
  this.ticlient.onerror = this.errorcb();
  this.ticlient.onload = this.successcb(); 
  this.ticlient.open(this.opt.method, this.opt.url, true);
  this.setheaders();

  // Make sure send will be called with client scope
  this.send = function (error, res) {
    return client.send.apply(that, [error, res]);
  };

  inproxy.passThroughProxy(this.opt.url, this);
};

/*
 * Call preconfigured Ti HTTPClient request,
 * and forward response to callback parameter
 */

client.call = function (callback) {
  var callbackBackup = this.opt.callback;
  var that = this;

  this.opt.callback = function (error, res) {
    that.opt.callback = callbackBackup;
    callback(error, res);
  };

  if (this.opt.retryEnabled) this.setTimeout();
  this.ticlient.send(this.opt.body);
};

/* Send response parameter to callback */

client.send = function (error, res) {
  this.opt.callback(error, res);
};

/* Set headers from options.headers object */

client.setheaders = function () {
  var that = this;

  Object.keys(this.opt.headers || {}).forEach(function (name) {
    that.ticlient.setRequestHeader(name, that.opt.headers[name]);
  });
};

/* Timeout callback wrapper */

client.setTimeout = function () {
  this.timeout = this.opt.timeout;

  if (typeof this.timeout === 'function') this.timeout = this.timeout(this.tryouts);

  this.timerId = setTimeout(this.ticlient.ontimeout, this.timeout);
};

client.clearTimeout = function () {
  clearTimeout(this.timerId);
};

client.timeoutcb = function (options) {
  var that = this;
  this.retry = function () {
    if (that.opt.retryTryouts != -1 && that.tryouts >= that.opt.retryTryouts) return;
    that.tryouts++;
    if (that.opt.retry) {
      that.opt.retry(options);
    }
    else {
      that.request(options);
    }
  };
  this.tryouts = this.tryouts || 0;

  return function () {
    that.ticlient.abort();
    that.send(new errors.TimeoutError(that.tryouts, options.url), null);
    that.retry();
  };
};

/* Error callback wrapper */

client.errorcb = function () {
  var that = this;

  return function (error) {
    var res = that.response(that.ticlient);
    error.tryouts = that.tryouts;
    that.send(error, null);
    that.clearTimeout();
    that.retry();
  };
};

/* Success callback wrapper */

client.successcb = function () {
  var that = this;

  return function () {
    var res = that.response(that.ticlient);

    cookie.save(that.opt.url, res.headers);
    that.send(null, res);
    that.clearTimeout();
    that.tryouts = 0;
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

    obj[matchName[1]] = matchValue[1];
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

  raw = this.ticlient.getAllResponseHeaders();
  if(!raw) return {};

  return this.splitobj(raw);
};

/* Response object factory */

client.response = function () {
  var that = this;
  var res = {
    code: this.ticlient.status,
    xml: this.xmlObject(),
    blob: this.ticlient.responseData,
    text: this.ticlient.responseText,
    json: this.jsonObject(),
    headers: this.headers()
  };

  this.opt.handlers.forEach(function (handler) {
    handler(that.opt, res);
  });

  return res;
};
