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

inproxy.defaultHandler = function (req) {
    req.call(req.send);
};

/* Exec registered proxy for a given url */

inproxy.passThroughProxy = function (url, req) {
    var proxy = inproxy.findProxy(url);

    return proxy(req);
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