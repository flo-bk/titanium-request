'use strict';

/*
 * Dependencies
 */

var logger = require('./logger');
var settings = require('./settings');

/*
 * Local Referencies
 */

var conn = null;
var db = module.exports = {};


/* Exports Titanium wrapper to DB.open */

db._open = function (dbname) {
  return Ti.Database.open(dbname);
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
