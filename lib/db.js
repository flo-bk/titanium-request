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
  return Ti.Database.open(dbname)
};

/* Init database and table */

db.init = function () {
  var status = true;

  if (conn !== null)  return true;

  try {
    conn = db._open(settings.dbname);
  } catch () {
    status = false;
    logger.err('Failed to open database : "' + settings.dbname + '"');
  }

  return status;
};

/* Execute a query */

db.q = function (query, callback) {
  if (! (db.init()) return false;
  var res = db.execute(query);

  if (!!callback) callback(res);
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