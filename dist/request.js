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
  var settings = __tetanize_require('lib/settings.js');
  var errors = __tetanize_require('lib/errors.js');
  
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
   * Change one settings variable
   */
  
  request.set = function (name, value) {
    settings[name] = value;
  };
  
  /*
   * Make the errors lib accessible
   */
  
  request.errors = errors;
  

});
__tetanize_define('lib/settings.js', function (exports, module) { 
  var settings = module.exports = {};
  
  settings.dbname = 'titanium_request';
  settings.loglevel = 1;
  settings.cookies = false;
  settings.retryEnabled = false;
  settings.retryTryouts = 3;
  settings.timeout = 10000;
  

});
__tetanize_define('lib/errors.js', function (exports, module) { 
  var errors = module.exports = {};
  
  errors.TimeoutError = function (tryouts, url) {
    this.message = 'TimeoutError';
    this.tryouts = tryouts;
    this.url = url;
  };
  
  errors.TimeoutError.prototype = Error.prototype;
  

});
__tetanize_define('lib/cookie.js', function (exports, module) { 
  /*
   * Dependencies
   */
  
  var db = __tetanize_require('lib/db.js');
  var settings = __tetanize_require('lib/settings.js');
  
  /*
   * Local Referencies
   */
  
  var cookie = module.exports = {};
  
  
  /* Save cookies from 'set-cookie' line */
  
  cookie.save = function (url, headers) {
    if (!settings.cookies) return false;
  
    var line = headers['set-cookie'] || headers['Set-Cookie'] || null;
    if (!line) return false;
  
    var domain = cookie.domain(url);
    var obj = cookie.parse(line);
    
    Object.keys(obj).forEach(function (name) {
      var value = obj[name];
  
      if (!cookie.update(domain, name, value)) {
        cookie.set(domain, name, value);
      }
    });
  
    return true;
  };
  
  /* Extend the actual cookie line */
  
  cookie.extend = function (url, headers) {
    if (!settings.cookies) return false;
  
    var paramName = !!headers['Cookie'] ? 'Cookie' : 'cookie';
    var domain = cookie.domain(url);
    var obj = cookie.getall(domain)
  
    if (!!headers[paramName]) {
      var patch = cookie.parse(headers[paramName]);
  
      Object.keys(patch).forEach(function (key) {
        obj[key] = patch[key];
      });
    }
  
    headers[paramName] = cookie.serialize(obj);
    return true;
  };
  
  /* Insert a new row in Cookies Table */
  
  cookie.set = function (domain, name, value) {
    db.q(db.format('INSERT OR REPLACE INTO cookie ({keys}) VALUES ({values})', {
      domain: domain,
      name: name,
      value: value
    }));
  };
  
  /* Select a row in Cookies Table */
  
  cookie.get = function (domain, name) {
    var obj = null;
    var query = db.format('SELECT * FROM cookie WHERE domain={domain} AND name={name}', {
      domain: domain,
      name: name
    });
  
    db.q(query, function (res) {
      result = res.fieldByName('value');
    });
  
    return result;
  };
  
  /* Select all cookies rows in Cookies Table for a specific domain */
  
  cookie.getall = function (domain) {
    var obj =  {};
    var query = db.format('SELECT * FROM cookie WHERE domain={domain}', {
      domain: domain
    });
  
    db.each(query, function (res) {
      obj[res.fieldByName('name')] = res.fieldByName('value');
    });
  
    return obj;
  };
  
  /* Parse a 'set-cookie' line */
  
  cookie.parse = function (line) {
    var obj = {}
    var pairs = line.split(/; */);
  
    pairs.forEach(function(pair) {
      cookie.append(pair, obj);
    });
  
    return obj;
  };
  
  /* Serialize a cookie object into a cookie line */
  
  cookie.serialize = function (obj) {
    return Object.keys(obj).map(function (key) {
      return key + '=' + encodeURIComponent(obj[key]);
    }).join(';');
  };
  
  /* Decode and add a cookie pair */
  
  cookie.append = function (pair, obj) {
    var eqId = pair.indexOf('=')
    if (eqId < 0) return;
  
    var key = pair.substr(0, eqId).trim()
    var val = pair.substr(++eqId, pair.length).trim();
  
    // quoted values
    if ('"' == val[0]) {
        val = val.slice(1, -1);
    }
  
    obj[key] = decodeURIComponent(val);
  };
  
  /* Retrieve domain from url */
  
  cookie.domain = function (url) {
    return url.match(/https?:\/\/([A-Za-z\-0-9]+\.)*([A-Za-z\-0-9]+\.[A-Za-z\-0-9]+)\/?.*/)[2];
  };

});
__tetanize_define('lib/client.js', function (exports, module) { 
  var cookie = __tetanize_require('lib/cookie.js');
  var queryString = __tetanize_require('node_modules/query-string/query-string.js');
  var extend = __tetanize_require('node_modules/extend/index.js');
  var settings = __tetanize_require('lib/settings.js');
  var errors = __tetanize_require('lib/errors.js');
  
  
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
  
    if (this.opt.debug) console.log(options.method, options.url);
  
    this.ticlient.ontimeout = this.timeoutcb(options);
    this.ticlient.onerror = this.errorcb();
    this.ticlient.onload = this.successcb() 
    this.ticlient.open(options.method, options.url, true);
    this.setheaders();
    this.ticlient.send(options.body);
  
    if (this.opt.retryEnabled) {
      this.setTimeout();
    }
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
    this.timerId = setTimeout(this.ticlient.ontimeout, this.opt.timeout);
    this.tryouts = this.tryouts || 0;
  };
  
  client.clearTimeout = function () {
    clearTimeout(this.timerId);
    this.tryouts = 0;
  };
  
  client.timeoutcb = function (options) {
    var that = this;
    this.retry = function () {
      if (that.opt.retryTryouts != -1 && that.tryouts >= that.opt.retryTryouts) return;
      that.tryouts++;
      that.request(options);
    };
  
    return function () {
      that.ticlient.abort();
      that.opt.callback(new errors.TimeoutError(that.tryouts, options.url), null);
      that.retry();
    };
  };
  
  /* Error callback wrapper */
  
  client.errorcb = function () {
    var that = this;
  
    return function (error) {
      var res = that.response(that.ticlient);
      that.opt.callback(error, null);
      that.clearTimeout();
    };
  };
  
  /* Success callback wrapper */
  
  client.successcb = function () {
    var that = this;
  
    return function () {
      var res = that.response(that.ticlient);
  
      cookie.save(that.opt.url, res.headers);
      that.opt.callback(null, res);
      that.clearTimeout();
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
__tetanize_define('lib/db.js', function (exports, module) { 
  /*
   * Dependencies
   */
  
  var logger = __tetanize_require('lib/logger.js');
  var settings = __tetanize_require('lib/settings.js');
  
  /*
   * Local Referencies
   */
  
  var conn = null;
  var db = module.exports = {};
  
  
  /* Exports Titanium wrapper to DB.open */
  
  db._open = function (dbname) {
    return Ti.Database.open(dbname)
  };
  
  /* Init database and table */
  
  db.init = function () {
    var status = true;
  
    if (conn !== null)  return true;
  
    try {
      conn = db._open(settings.dbname);
    } catch (err) {
      status = false;
      logger.err('Failed to open database : "' + settings.dbname + '"');
    }
  
    return status;
  };
  
  /* Execute a query */
  
  db.q = function (query, callback) {
    if (! (db.init())) return false;
    var res = conn.execute(query);
  
    if (!!callback && res.isValidRow()) callback(res);
    res.close();
    return true;
  };
  
  /* Execute a query for several lines */
  
  db.each = function (query, callback) {
    db.q(query, function (res) {
      while (res.isValidRow())
      {
        callback(res);
        res.next();
      }
    });
  };
  
  /* Format query with given values */
  
  db.format = function (query, values) {
    var res = query
      .replace('{keys}', Object.keys(values).join(','))
      .replace('{values}', Object.keys(values).map(function (key) {
        return '\'' + values[key] + '\'';
      }).join(','));
  
    Object.keys(values).forEach(function (key) {
      res = res.replace('{' + key + '}', '\'' + values[key] + '\'');
    });
  
    return res;
  };

});
__tetanize_define('lib/logger.js', function (exports, module) { 
  /*
   * Dependencies
   */
  
  var settings = __tetanize_require('lib/settings.js');
  
  /*
   * Local Referencies
   */
  
  var logger = module.exports = {};
  var levels = ['error', 'warning', 'debug', 'info'];
  
  
  /* Main log function */
  
  logger.log = function (lvl, msg) {
    if (settings.loglevel >= lvl) console.log(msg);
  };
  
  /* Generate accessors */
  
  levels.forEach(function (lvlname) {
    logger[lvlname] = function (msg) {
      var lvl = levels.indexOf(lvlname);
  
      logger.log(lvl, msg);
    };
  });
  
  /* Aliases */
  
  logger.err = logger.error;
  logger.warn = logger.warning;
  logger.d = logger.debug;
  

});

module.exports = __tetanize_require('index.js');