var cookie = require('./cookie');

/*
 * Exports Client constructor
 */

var Client = module.exports = function () {
  if (!(this instanceof Client)) return new Client;

  this.ticlient = Client._ticlient();
};

/* Simple Titanium HTTPClient constructor */

Client._ticlient = function () {
  return Ti.Network.createHTTPClient();
};


/*
 * Local Referencies
 */

var client = Client.prototype;


/* HTTP request factory */

client.request = function (options) {
  var that = this;

  this.opt = options;
  options.headers = options.headers || {};

  cookie.extend(options.url, options.headers);
  this.opt.handlers.forEach(function (handler) {
    handler(that.opt, null);
  });

  this.ticlient.onerror = this.errorcb();
  this.ticlient.onload = this.successcb() 
  this.ticlient.open(options.method, options.url, true);
  this.setheaders();
  this.ticlient.send(options.data);
};

/* Set headers from options.headers object */

client.setheaders = function () {
  var that = this;

  Object.keys(this.opt.headers || {}).forEach(function (name) {
    that.ticlient.setRequestHeader(name, that.opt.headers[name]);
  });
};

/* Error callback wrapper */

client.errorcb = function () {
  var that = this;

  return function (error) {
    that.opt.callback(error, null);
  };
};

/* Success callback wrapper */

client.successcb = function () {
  var that = this;

  return function () {
    var res = that.response(that.ticlient);

    cookie.save(that.opt.url, res.headers);
    that.opt.callback(null, res);
  };
};

/* Try to parse text response with JSON, returns null on error */

client.jsonObject = function () {
  var jsonObject = null;

  try {
    jsonObject = JSON.parse(this.ticlient.responseText);
  } catch (err) {
    if (this.debug) console.log(err);  
  }
  
  return jsonObject;
};

/* Try to parse text response with XML, returns null on error */

client.xmlObject = function () {
  var xmlObject = null;

  try {
    xmlObject = this.ticlient.responseXML;
  } catch (err) {
    if (this.debug) console.log(err);  
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