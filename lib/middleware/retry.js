'use strict';

/*
 * Dependencies 
 */


var client = require('../client');
var extend = require('extend');
var TimeoutError = require('../errors').TimeoutError;

/*
 * Defaults middleware settings
 */

var retryDefaults = {
    multiplier: 1,
    maxTryouts: 3
};

/* If TimeoutError is received,
 * increase previous timeout and call a new request */

function parseResponse(config, req, res, err) {
    if (! err instanceof TimeoutError) return;

    req.tryout = req.tryout || 1;
    if (req.tryout >= config.maxTryouts) return;

    req.tryout++;
    req.timeout = req.timeout * config.multiplier;
    client(req).request();
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