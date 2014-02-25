var request = require('request');

request.get('http://www.google.com', function (err, res) {
  console.log(res.text);
});