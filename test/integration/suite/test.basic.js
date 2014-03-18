var assert = require('assert');
var express = require('express');

describe('app', function () {

    it('should be able to call a simple URL', function (done) {
      var app = express();
      
      app.get('/whatsnext', function(req, res) {
        res.end();
        done();
      });

      app.listen(8888);
    });

});