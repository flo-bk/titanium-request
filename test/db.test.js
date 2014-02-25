var assert = require('assert');
var request = require('..');
var mockti = require('mockti');
var db = require('../lib/db');
var jsonFixture = require('./fixtures/responsejson');
var textFixture = require('./fixtures/responsetext');

describe('cookie', function () {

  describe('format()', function () {
    
    it('should replace keys in line', function () {
      assert.equal('foobar', db.format('{keys}', {foobar: 42}));
    });

    it('should replace values in line', function () {
      assert.equal('\'42\'', db.format('{values}', {foobar: 42}));
    });

    it('should chain keys in line', function () {
      assert.equal('foobar,hello,something', db.format('{keys}', {
        foobar: 42,
        hello: 'world',
        something: 'good'
      }));
    });

    it('should chain values in line', function () {
      assert.equal('\'42\',\'world\',\'good\'', db.format('{values}', {
        foobar: 42,
        hello: 'world',
        something: 'good'
      }));
    });

  });

});