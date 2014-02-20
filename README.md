# titanium-request

## Installation

Get the latest [dist/request.js](https://raw.github.com/dawicorti/titanium-request/master/dist/request.js) into your __Resources__ folder or your __app/lib__ folder, if you're using __Alloy__.

## API

__request.get__(url, callback, [options])

__request.post__(url, data, [options])

__request.put__(url, data, [options])

__request.delete__(url, [options])

## Example

```js
var request = require('request');

request.get('http://www.example.com', function (err, res) {
  if (!err && !!res.json) console.log('Got value :', res.json.value);
});

```
