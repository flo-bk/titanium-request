# titanium-request

## Installation

Get the latest [dist/request.js](https://raw.github.com/IsCoolEntertainment/titanium-request/master/dist/request.js) into your __Resources__ folder or your __app/lib__ folder, if you're using __Alloy__.

## API

__request.get__(url, callback, [options])

_In GET case, data is converted to query string_

__request.post__(url, callback, [options])

__request.put__(url, callback, [options])

__request.delete__(url, callback, [options])

## Example

```js
request.get('http://www.example.com', function (err, res) {
  if (res && res.json) console.log('Got JSON response :', res.json);
});
```

## Response Object

The response object is given as second parameter of a callback, is no error occurred in the request.

* __res.code__ : HTTP Status code
* __res.text__ : Response as __String__ format
* __res.blob__ : Response as [Titanium.Blob](http://docs.appcelerator.com/titanium/latest/#!/api/Titanium.Blob) format
* __res.xml__  : Response as [Titanium.XML.Document](http://docs.appcelerator.com/titanium/latest/#!/api/Titanium.XML.Document) format (null if text is not XML compliant)
* __res.json__ : Response as __JSON__ object (null if text is not JSON compliant)
* __res.headers__ : Response headers as __JSON__ object

## Request Headers

Request headers are passed through the options object

```js
var headers = {
  'cookie': 'session=E8vh78'
};

request.post('http://www.example.com/article', function (err, res) {
  if (res && res.json) console.log('Got JSON response :', res.json);
}, {headers: headers});
```

## Wish list

* Cookies cache (work in progress)
* Requests Pool
* Response cache
* Mocks
