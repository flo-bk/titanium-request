var __tetanize_modules = {};
var __tetanize_constructors = {};
var __tetanize_top_require = require;
var __tetanize_require = function (id) {
    var required;

    if (__tetanize_modules.hasOwnProperty(id)) {
        required = __tetanize_modules[id];
    } else if (__tetanize_constructors.hasOwnProperty(id)) {
        var mod = {exports: {}};

        __tetanize_constructors[id](__tetanize_require, mod.exports, mod);
        __tetanize_modules[id] = mod.exports;
        required = __tetanize_modules[id];
    } else {
        required = __tetanize_top_require(id);
    }

    return required;
};
var __tetanize_define = function (id, constructor) {
    __tetanize_constructors[id] = constructor;
};

__tetanize_define('index.js', function (require, exports, module) { 
  /*
   * Dependencies 
   */
  
  var client = require('lib/client.js');
  
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
  

});
__tetanize_define('lib/client.js', function (require, exports, module) { 
  
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
   * Local Dependencies
   */
  
  var client = Client.prototype;
  
  
  /* HTTP request factory */
  
  client.request = function (options) {
    this.opt = options;
    this.setheaders(ticlient);
    ticlient.onerror = this.errorcb(ticlient);
    ticlient.onload = this.successcb(ticlient) 
    ticlient.open(options.method, options.url, true);
    ticlient.send(options.data);
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
      that.opt.callback(null, that.response(that.ticlient));
    };
  };
  
  /* Try to parse text response, returns null */
  
  client.jobject = function () {
    var jobject = null;
  
    try {
      jobject = JSON.parse(this.ticlient.responseText);
    } catch (err) {
      if (this.debug) console.log(err);  
    }
    
    return jobject;  
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
  
    return {
      code: this.ticlient.status,
      xml: this.ticlient.responseXML,
      blob: this.ticlient.responseData,
      text: this.ticlient.responseText,
      json: this.jobject(),
      headers: this.headers()
    }
  };

});

module.exports = __tetanize_require('index.js');