/*
 * Dependencies
 */

var db = require('./db');
var settings = require('./settings');

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