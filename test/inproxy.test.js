var assert = require('assert');
var inproxy = require('../lib/inproxy');

describe('inproxy', function () {

    it('should find a regex registered proxy', function () {
        var myHandler = function () {};

        inproxy.registerProxy(/^[a-z]{4}$/, myHandler);
        assert.equal(myHandler, inproxy.findProxy('abcd'));
    });

});