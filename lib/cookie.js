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
      cookie.insert(domain, name, value);
    }
  });

  return true;
};

/* Insert a new row in Cookies Table */

cookie.set = function (domain, name, value) {
  db.q(db.format('INSERT OR REPLACE INTO cookie ({keys}) VALUES ({keys})', {
    domain: domain,
    name: name,
    value: value
  }));
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