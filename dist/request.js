var __tetanize_modules = {};
var __tetanize_constructors = {};
var __tetanize_top_require = require;
var __tetanize_require = function (id) {
    var required;

    if (__tetanize_modules.hasOwnProperty(id)) {
        required = __tetanize_modules[id];
    } else if (__tetanize_constructors.hasOwnProperty(id)) {
        var mod = {exports: {}};

        __tetanize_constructors[id](mod.exports, mod);
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

__tetanize_define('index.js', function (exports, module) { 
  /*
   * Dependencies 
   */
  
  var client = __tetanize_require('lib/client.js');
  var inproxy = __tetanize_require('lib/inproxy.js');
  var settings = __tetanize_require('lib/settings.js');
  var errors = __tetanize_require('lib/errors.js');
  var middlewares = {
    cookie: __tetanize_require('lib/middleware/cookie.js'),
    retry: __tetanize_require('lib/middleware/retry.js')
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
  
    return client(options);
  };
  
  /*
   * @api
   * Proceed an HTTP request with GET method
   */
  
  request.get = function (url, callback, options) {
    request.setup(url, callback, options, 'GET').call();
  };
  
  
  /*
   * @api
   * Proceed an HTTP request with POST method
   */
  
  request.post = function (url, callback, options) {
    request.setup(url, callback, options, 'POST').call();
  };
  
  
  /*
   * @api
   * Proceed an HTTP request with PUT method
   */
  
  request.put = function (url, callback, options) {
    request.setup(url, callback, options, 'PUT').call();
  };
  
  
  /*
   * @api
   * Proceed an HTTP request with DELETE method
   */
  
  request.delete = function (url, callback, options) {
    request.setup(url, callback, options, 'DELETE').call();
  };
  
  /*
   * @api
   * Adds middleware for requests and reponses
   */
  
  request.use = function (handler) {
    if (handlers.indexOf(handler) === -1)
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
  

});
__tetanize_define('lib/inproxy.js', function (exports, module) { 
  'use strict';
  
  
  /*
   * Local proxy for mocking / caching or modify requests
   */
  
  var inproxy = module.exports = {};
  
  
  /*
   * Local referencies
   */
  
  var proxies = [];
  
  
  /* Default handler only forward response from host to user */
  
  inproxy.defaultHandler = function (client) {
      client.call(client.send);
  };
  
  /* Exec registered proxy for a given url */
  
  inproxy.passThroughProxy = function (url, client) {
      var proxy = inproxy.findProxy(url);
  
      return proxy(client);
  };
  
  /* Find first matched url proxy */
  
  inproxy.findProxy = function (url) {
      var found = inproxy.defaultHandler;
  
      proxies.some(function (proxy) {
          if (url.match(proxy.reg)) {
              found = proxy.handler;
              return true;
          }
  
          return false;
      });
  
      return found;    
  };
  
  /* Register proxy using rule (regex or string) and callback handler */
  
  inproxy.registerProxy = function (regOrString, handler) {
      var reg = typeof regOrString === 'string' ? new RegExp(regOrString) : regOrString;
  
      proxies.push({reg: reg, handler: handler});
  };

});
__tetanize_define('lib/settings.js', function (exports, module) { 
  'use strict';
  
  var settings = module.exports = {};
  
  settings.loglevel = 1;
  settings.timeout = 10000;

});
__tetanize_define('lib/errors.js', function (exports, module) { 
  'use strict';
  
  var errors = module.exports = {};
  
  var RequestError = function(name, infos) {
      this.name = name;
      this.infos = infos || {};
  }
  
  RequestError.prototype = new Error();
  
  RequestError.prototype.toString = function () {
      var infos = this.infos;
      var infosLine = Object.keys(infos).map(function (name) {
          return name + '=' + infos[name];
      }).join(';');
  
  
      return this.name + (infosLine.length > 0 ? ' : ' + infosLine : '');
  };
  
  RequestError.extend = function () {
      var args = Array.prototype.slice.call(arguments);
      var ErrorChild = function () {
          var childArgs = Array.prototype.slice.call(arguments);
          var name = args[0];
          var index = 1;
          var infos = {};
  
          for (index = 1; index < args.length; index++) {
              if (index - 1 < childArgs.length) {
                  infos[args[index]] = childArgs[index - 1];
              }
          }
  
          RequestError.apply(this, [name, infos]);
      }
  
      ErrorChild.prototype = new RequestError();
      return ErrorChild;
  };
  
  
  errors.TimeoutError = RequestError.extend('TimeoutError', 'timeout');
  errors.NoNetworkError = RequestError.extend('NoNetworkError');

});
__tetanize_define('lib/client.js', function (exports, module) { 
  'use strict';
  
  /*
   * Dependencies
   */
  
  var bindAll = __tetanize_require('node_modules/bindall-standalone/index.js');
  var queryString = __tetanize_require('node_modules/query-string/query-string.js');
  var extend = __tetanize_require('node_modules/extend/index.js');
  var inproxy = __tetanize_require('lib/inproxy.js');
  var settings = __tetanize_require('lib/settings.js');
  var errors = __tetanize_require('lib/errors.js');
  
  
  /*
   * Exports Client constructor
   */
  
  var Client = module.exports = function (options) {
    if (!(this instanceof Client)) return new Client(options);
  
    bindAll(this);
    this.ticlient = this.getHTTPClient();
    this.opt = extend({
      handlers: [],
      headers: {}
    }, settings, options || {});
  };
  
  /*
   * Local Referencies
   */
  
  var client = Client.prototype;
  
  
  /* setTimeout wrapper (help tests) */
  
  client.setTimeout = function (handler, timeout) {
    return setTimeout(handler, timeout);
  };
  
  /* Network.online wrapper (help tests) */
  
  client.isOnline = function () {
    return Ti.Network.online;
  }
  
  /* Titanium HTTPClient constructor (help tests) */
  
  client.getHTTPClient = function () {
    return Ti.Network.createHTTPClient();
  };
  
  /* Chain handlers and callback, if every handlers returned anything but false */
  
  client.runHandlers = function (req, res, err, callback) {
    var status = this.opt.handlers.every(function (handler) {
      return handler(req, res, err) !== false;
    });
  
    if (status === true) callback.apply(this, [err, res]);
  };
  
  client.prepareCall = function (hook, callback) {
    var that = this;
  
    this.opt.hook = hook;
    this.runHandlers(this.opt, null, null, function () {
      var url = that.opt.url;
      var query = queryString.stringify(that.opt.query || {});
  
      if (query.length > 0) url += '?' + query;
      if (that.opt.debug) console.log(that.opt.method, url);
  
      // Make sure ticlient won't get the timeout before us
      that.ticlient.timeout = that.opt.timeout * 100;
      that.ticlient.onerror = that.handlePartialResponse();
      that.ticlient.onload = that.handlePartialResponse(null);
      that.timeoutid = this.setTimeout(function () {
        that.handleResponse(new errors.TimeoutError(that.opt.timeout));
      }, that.opt.timeout);
      that.ticlient.open(that.opt.method, url, true);
      that.setHeaders();
      callback.apply(that, [url]);
    });
  };
  
  /*
   * Call preconfigured Ti HTTPClient request,
   * and forward response to callback parameter
   */
  
  client.call = function (hook) {
    var that = this;
  
    this.prepareCall(hook, function (url) {
      that.ticlient.send(that.opt.body);
    });
  };
  
  /* Send response parameter to callback */
  
  client.send = function (err, res) {
    var callback = this.opt.hook || this.opt.callback;
  
    this.opt.hook = null;
    callback(!!err ? err : null, !!err ? null : res);
  };
  
  /* Set headers from options.headers object */
  
  client.setHeaders = function () {
    var that = this;
  
    Object.keys(this.opt.headers || {}).forEach(function (name) {
      that.ticlient.setRequestHeader(name, that.opt.headers[name]);
    });
  };
  
  /* Return a response handler that can be called only once */
  
  client.handleResponse = function (err) {
    var that = this;
    var res = this.response();
  
    clearTimeout(that.timeoutid);
    if (this.responseHandled) return false;
    if (! this.isOnline()) err = new errors.NoNetworkError();
  
    this.responseHandled = true;
    this.runHandlers(this.opt, res, err, this.send);
  };
  
  /* Call handleResponse, force error argument and keep scope */
  
  client.handlePartialResponse = function () {
    var that = this;
    var args = Array.prototype.slice.call(arguments);
  
    return function (err) {
      that.handleResponse(args.length > 0 ? args[0] : err);
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
  
  client.splitObj = function (raw) {
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
  
    return this.splitObj(this.ticlient.getAllResponseHeaders());
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
  

});
__tetanize_define('node_modules/bindall-standalone/index.js', function (exports, module) { 
  'use strict';
  
  var toString = Object.prototype.toString,
      hasOwnProperty = Object.prototype.hasOwnProperty;
  
  module.exports = function(object) {
      if(!object) return console.warn('bindAll requires at least one argument.');
  
      var functions = Array.prototype.slice.call(arguments, 1);
  
      if (functions.length === 0) {
  
          for (var method in object) {
              if(hasOwnProperty.call(object, method)) {
                  if(typeof object[method] == 'function' && toString.call(object[method]) == "[object Function]") {
                      functions.push(method);
                  }
              }
          }
      }
  
      for(var i = 0; i < functions.length; i++) {
          var f = functions[i];
          object[f] = bind(object[f], object);
      }
  };
  
  /*
      Faster bind without specific-case checking. (see https://coderwall.com/p/oi3j3w).
      bindAll is only needed for events binding so no need to make slow fixes for constructor
      or partial application.
  */
  function bind(func, context) {
    return function() {
      return func.apply(context, arguments);
    };
  }

});
__tetanize_define('node_modules/query-string/query-string.js', function (exports, module) { 
  /*!
  	query-string
  	Parse and stringify URL query strings
  	https://github.com/sindresorhus/query-string
  	by Sindre Sorhus
  	MIT License
  */
  (function () {
  	'use strict';
  	var queryString = {};
  
  	queryString.parse = function (str) {
  		if (typeof str !== 'string') {
  			return {};
  		}
  
  		str = str.trim().replace(/^\?/, '');
  
  		if (!str) {
  			return {};
  		}
  
  		return str.trim().split('&').reduce(function (ret, param) {
  			var parts = param.replace(/\+/g, ' ').split('=');
  			var key = parts[0];
  			var val = parts[1];
  
  			key = decodeURIComponent(key);
  			// missing `=` should be `null`:
  			// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
  			val = val === undefined ? null : decodeURIComponent(val);
  
  			if (!ret.hasOwnProperty(key)) {
  				ret[key] = val;
  			} else if (Array.isArray(ret[key])) {
  				ret[key].push(val);
  			} else {
  				ret[key] = [ret[key], val];
  			}
  
  			return ret;
  		}, {});
  	};
  
  	queryString.stringify = function (obj) {
  		return obj ? Object.keys(obj).map(function (key) {
  			var val = obj[key];
  
  			if (Array.isArray(val)) {
  				return val.map(function (val2) {
  					return encodeURIComponent(key) + '=' + encodeURIComponent(val2);
  				}).join('&');
  			}
  
  			return encodeURIComponent(key) + '=' + encodeURIComponent(val);
  		}).join('&') : '';
  	};
  
  	if (typeof module !== 'undefined' && module.exports) {
  		module.exports = queryString;
  	} else {
  		window.queryString = queryString;
  	}
  })();
  

});
__tetanize_define('node_modules/extend/index.js', function (exports, module) { 
  var hasOwn = Object.prototype.hasOwnProperty;
  var toString = Object.prototype.toString;
  
  function isPlainObject(obj) {
  	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval)
  		return false;
  
  	var has_own_constructor = hasOwn.call(obj, 'constructor');
  	var has_is_property_of_method = hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
  	// Not own constructor property must be Object
  	if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
  		return false;
  
  	// Own properties are enumerated firstly, so to speed up,
  	// if last one is own, then all properties are own.
  	var key;
  	for ( key in obj ) {}
  
  	return key === undefined || hasOwn.call( obj, key );
  };
  
  module.exports = function extend() {
  	var options, name, src, copy, copyIsArray, clone,
  	    target = arguments[0] || {},
  	    i = 1,
  	    length = arguments.length,
  	    deep = false;
  
  	// Handle a deep copy situation
  	if ( typeof target === "boolean" ) {
  		deep = target;
  		target = arguments[1] || {};
  		// skip the boolean and the target
  		i = 2;
  	}
  
  	// Handle case when target is a string or something (possible in deep copy)
  	if ( typeof target !== "object" && typeof target !== "function") {
  		target = {};
  	}
  
  	for ( ; i < length; i++ ) {
  		// Only deal with non-null/undefined values
  		if ( (options = arguments[ i ]) != null ) {
  			// Extend the base object
  			for ( name in options ) {
  				src = target[ name ];
  				copy = options[ name ];
  
  				// Prevent never-ending loop
  				if ( target === copy ) {
  					continue;
  				}
  
  				// Recurse if we're merging plain objects or arrays
  				if ( deep && copy && ( isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
  					if ( copyIsArray ) {
  						copyIsArray = false;
  						clone = src && Array.isArray(src) ? src : [];
  
  					} else {
  						clone = src && isPlainObject(src) ? src : {};
  					}
  
  					// Never move original objects, clone them
  					target[ name ] = extend( deep, clone, copy );
  
  				// Don't bring in undefined values
  				} else if ( copy !== undefined ) {
  					target[ name ] = copy;
  				}
  			}
  		}
  	}
  
  	// Return the modified object
  	return target;
  };
  

});
__tetanize_define('lib/middleware/cookie.js', function (exports, module) { 
  'use strict';
  
  /*
   * Dependencies 
   */
  
  
  var cookie = __tetanize_require('node_modules/cookie/index.js');
  var extend = __tetanize_require('node_modules/extend/index.js');
  var parseUri = __tetanize_require('node_modules/parseUri/parseuri.js');
  
  
  var db = null;
  var specials = ['_id', '_rev', 'Domain', 'Expires', 'Path', 'Max-Age'];
  
  
  /* Prepare database on CouchDBLite (via ti_touchdb)*/
  
  function initDB() {
      // Isolate this one require because it will fails test
  
      var manager = __tetanize_require('com.obscure.titouchdb').databaseManager;
      db = manager.getDatabase('request_cookie');
  }
  
  /* Save cookies obj into host document */
  
  function setCookies(host, cookieSet) {
      if (db === null) initDB();
  
      var doc = db.getDocument(host);
      var props = doc.properties || {};
  
      doc.putProperties(extend({}, props, cookieSet));
  }
  
  /* Iter over host cookies and filter specials (W3C + CouchDB) names */
  
  function eachFilteredCookies(host, fn) {
      if (db === null) initDB();
  
      var doc = db.getDocument(host);
      var props = doc.properties || {};
  
      Object.keys(props).forEach(function (name) {
          if (specials.indexOf(name) < 0) fn(props[name], name);
      });
  }
  
  /* Extract set-cookie line from http response */
  
  function extractCookieSet(res) {
      var line = null;
  
      if (res.headers.hasOwnProperty('Set-Cookie')) line = res.headers['Set-Cookie'];
      if (res.headers.hasOwnProperty('set-cookie')) line = res.headers['set-cookie'];
  
      if (!line) return {};
  
      return cookie.parse(line);
  }
  
  /* Save all server requested cookies for current host */
  
  function parseResponseHeaders(req, res) {
      var host = parseUri(req.url).host;
      var cookieSet = extractCookieSet(res);
  
      setCookies(host, cookieSet);
  }
  
  /* Add saved cookies for current host into request headers */
  
  function extendRequestHeaders(req, res) {
      req.headers = req.headers || {};
      req.headers.cookie = req.headers.cookie || '';
  
      var host = parseUri(req.url).host;
      var requestCookies = cookie.parse(req.headers.cookie);
  
      eachFilteredCookies(host, function (value, name) {
          requestCookies[name] = value;
      });
  
      req.headers.cookie = Object.keys(requestCookies).map(function (name) {
          return name + '=' + requestCookies[name];
      }).join('; ');
  }
  
  /*
   * Generate the cookie middleware
   */
  
  module.exports = function createMiddleware() {
      return function cookieMiddleware(req, res) {
          if (!!res) {
              parseResponseHeaders(req, res);
          } else {
              extendRequestHeaders(req, res);
          }
      };
  };

});
__tetanize_define('lib/middleware/retry.js', function (exports, module) { 
  'use strict';
  
  /*
   * Dependencies 
   */
  
  
  var client = __tetanize_require('lib/client.js');
  var extend = __tetanize_require('node_modules/extend/index.js');
  var TimeoutError = __tetanize_require('lib/errors.js').TimeoutError;
  
  /*
   * Defaults middleware settings
   */
  
  var retryDefaults = {
      multiplier: 1,
      maxTryouts: 3
  };
  
  /* If TimeoutError is received,
   * increase previous timeout and call a new request
   */
  
  function parseResponse(config, req, res, err) {
      if (! (err instanceof TimeoutError)) return;
  
      req.tryout = req.tryout || 1;
      if (req.tryout >= config.maxTryouts) return;
  
      req.tryout++;
      req.timeout = req.timeout * config.multiplier;
      client(req).call();
      return false;
  };
  
  /*
   * Generate the retry middleware
   */
  
  module.exports = function createMiddleware(opts) {
      var config = extend({}, retryDefaults, opts || {});
  
      return function retryMiddleware(req, res, err) {
          if (!!res) {
              return parseResponse(config, req, res, err);
          }
      };
  };

});
__tetanize_define('node_modules/cookie/index.js', function (exports, module) { 
  
  /// Serialize the a name value pair into a cookie string suitable for
  /// http headers. An optional options object specified cookie parameters
  ///
  /// serialize('foo', 'bar', { httpOnly: true })
  ///   => "foo=bar; httpOnly"
  ///
  /// @param {String} name
  /// @param {String} val
  /// @param {Object} options
  /// @return {String}
  var serialize = function(name, val, opt){
      opt = opt || {};
      var enc = opt.encode || encode;
      var pairs = [name + '=' + enc(val)];
  
      if (null != opt.maxAge) {
          var maxAge = opt.maxAge - 0;
          if (isNaN(maxAge)) throw new Error('maxAge should be a Number');
          pairs.push('Max-Age=' + maxAge);
      }
  
      if (opt.domain) pairs.push('Domain=' + opt.domain);
      if (opt.path) pairs.push('Path=' + opt.path);
      if (opt.expires) pairs.push('Expires=' + opt.expires.toUTCString());
      if (opt.httpOnly) pairs.push('HttpOnly');
      if (opt.secure) pairs.push('Secure');
  
      return pairs.join('; ');
  };
  
  /// Parse the given cookie header string into an object
  /// The object has the various cookies as keys(names) => values
  /// @param {String} str
  /// @return {Object}
  var parse = function(str, opt) {
      opt = opt || {};
      var obj = {}
      var pairs = str.split(/; */);
      var dec = opt.decode || decode;
  
      pairs.forEach(function(pair) {
          var eq_idx = pair.indexOf('=')
  
          // skip things that don't look like key=value
          if (eq_idx < 0) {
              return;
          }
  
          var key = pair.substr(0, eq_idx).trim()
          var val = pair.substr(++eq_idx, pair.length).trim();
  
          // quoted values
          if ('"' == val[0]) {
              val = val.slice(1, -1);
          }
  
          // only assign once
          if (undefined == obj[key]) {
              try {
                  obj[key] = dec(val);
              } catch (e) {
                  obj[key] = val;
              }
          }
      });
  
      return obj;
  };
  
  var encode = encodeURIComponent;
  var decode = decodeURIComponent;
  
  module.exports.serialize = serialize;
  module.exports.parse = parse;
  

});
__tetanize_define('node_modules/parseUri/parseuri.js', function (exports, module) { 
  // a node.js module fork of
  // parseUri 1.2.2
  // (c) Steven Levithan <stevenlevithan.com>
  // MIT License
  // see: http://blog.stevenlevithan.com/archives/parseuri
  // see: http://stevenlevithan.com/demo/parseuri/js/
  
  //forked into a node.js module by franz enzenhofer 
   
  
  function parseUri (str) {
  	var	o   = parseUri.options,
  		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
  		uri = {},
  		i   = 14;
  
  	while (i--) uri[o.key[i]] = m[i] || "";
  
  	uri[o.q.name] = {};
  	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
  		if ($1) uri[o.q.name][$1] = $2;
  	});
  
  	return uri;
  };
  
  parseUri.options = {
  	strictMode: false,
  	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
  	q:   {
  		name:   "queryKey",
  		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
  	},
  	parser: {
  		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
  		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  	}
  };
  
  module.exports = parseUri

});

module.exports = __tetanize_require('index.js');