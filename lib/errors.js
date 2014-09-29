'use strict';

var errors = module.exports = {};

errors.TimeoutError = function (tryouts, url) {
  this.message = 'TimeoutError';
  this.tryouts = tryouts;
  this.url = url;
};

errors.TimeoutError.prototype = Error.prototype;
