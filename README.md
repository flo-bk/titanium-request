# titanium-request

## Installation

Get the latest [dist/request.js](https://raw.github.com/IsCoolEntertainment/titanium-request/master/dist/request.js) into your __Resources__ folder or your __app/lib__ folder, if you're using __Alloy__.

## API

__request.get__(url, callback, [options])

__request.post__(url, data, [options])

__request.put__(url, data, [options])

__request.delete__(url, [options])

## Example

```js
var request = require('request');

request.get('http://www.example.com', function (err, res) {
  if (!err && !!res.json) console.log('Got JSON response :', res.json);
});
```

## JSON Response Object

The JSON object is given as second parameter of a callback, is no error occurred in the request.

* __res.code__ : HTTP Status code
* __res.text__ : Response as __String__ format
* __res.blob__ : Response as [Titanium.Blob](http://docs.appcelerator.com/titanium/latest/#!/api/Titanium.Blob) format
* __res.xml__  : Response as [Titanium.XML.Document](http://docs.appcelerator.com/titanium/latest/#!/api/Titanium.XML.Document) format (null if text is not XML compliant)
* __res.json__ : Response as __JSON__ object (null if text is not JSON compliant)
* __res.headers__ : Response headers as __JSON__ object

## Wish list

* __options.headers__ object
* Cookies cache
* Requests Pool
* Retries
* Response cache
