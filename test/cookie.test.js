var assert = require('assert');
var request = require('..');
var mockti = require('mockti');
var cookie = require('../lib/cookie');
var jsonFixture = require('./fixtures/responsejson');
var textFixture = require('./fixtures/responsetext');

describe('cookie', function () {

  describe('parse()', function () {
    
    it('should retrieve json data from set-cookie line', function () {
      assert.equal('/', cookie.parse('session=AFLKaio5==;Path=/').Path);
      assert.equal('AFLKaio5==', cookie.parse('session=AFLKaio5==;Path=/').session);
    });

  });

  describe('serialize()', function () {
    
    it('should retrieve a cookie string from an object', function () {
      assert.equal('foobar=42;Path=%2F', cookie.serialize({foobar: 42, Path: '/'}));
    });

  });

  describe('domain()', function () {
    
    it('should work with simple uri', function () {
      assert.equal('example.com', cookie.domain('http://example.com'));
    });

    it('should work with subdomain', function () {
      assert.equal('example.com', cookie.domain('http://www.example.com'));
    });

    it('should work with subdomain comparison', function () {
      assert.equal(cookie.domain('http://api.example.com'), cookie.domain('http://www.example.com'));
    });

    it('should work with path', function () {
      assert.equal('example.com', cookie.domain('http://api.example.com/v1/jobs'));
    });

    it('should work with queries', function () {
      assert.equal('example.com', cookie.domain('http://api.example.com?foobar=42'));
    });

    it('should work with https', function () {
      assert.equal('example.com', cookie.domain('https://api.example.com?foobar=42'));
    });

  });

});