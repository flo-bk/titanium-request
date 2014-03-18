var request = require('request');
var host = 'http://localhost:8888';

request.get(host + '/whatsnext', function (err, res) {
  console.log('************ Everything good !');
});