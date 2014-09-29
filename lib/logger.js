'use strict';

/*
 * Dependencies
 */

var settings = require('./settings');

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
