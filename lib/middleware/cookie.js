'use strict';

/*
 * Dependencies 
 */


var cookie = require('cookie');
var extend = require('extend');
var parseUri = require('parseUri');


var db = null;
var specials = ['_id', '_rev', 'Domain', 'Expires', 'Path', 'Max-Age'];


/* Prepare database on CouchDBLite (via ti_touchdb)*/

function initDB() {
    // Isolate this one require because it will fails test

    var manager = require('com.obscure.titouchdb').databaseManager;
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