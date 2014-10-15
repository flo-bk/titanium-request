# titanium-request

## Installation

Get the latest [dist/request.js](https://raw.github.com/IsCoolEntertainment/titanium-request/master/dist/request.js) into your __Resources__ folder or your __app/lib__ folder, if you're using __Alloy__.

## Base API

__request.get__(url, callback, [options])

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

The request headers are passed through the options object

```js
var headers = {
  'cookie': 'session=E8vh78'
};

request.post('http://www.example.com/article', function (err, res) {
  if (res && res.json) console.log('Got JSON response :', res.json);
}, {headers: headers});
```

## Query string

The query string is passed as an object through the options object

```js
request.get('http://www.example.com/article/5', function (err, res) {
  // this request will be called with the following URL :
  // http://www.example.com/article/5?foo=bar&bar=baz
}, {query : {foo: 'bar', bar: 'baz'}});
```

## Request body

The request body is passed through the options object
It can be a string, an Object or a [Blob](http://docs.appcelerator.com/titanium/latest/#!/api/Titanium.Blob)

```js

var payload = {
  author: 'Mark Twain',
  title: 'Tom Sawyer'
};

request.post('http://www.example.com/book', function (err, res) {
  // payload was sent as a form-encoded POST data
}, {body: payload});
```

## Middlewares

You can register a middleware if you want to execute code

* before the request final call
OR
* before the response callback

*Example 1 : patch headers for all the requests*

```js
request.use(function (req, res) {
  if (!!res) return; // If res is filled, we are executed after the request call
  req.headers['x-foo'] = 'bar'; 
});
```

*Example 2 : trigger event when user data is returned in response*

```js
request.use(function (req, res) {
  if (!!res && !!res.json && !!res.json.user) {
    Ti.App.fireEvent('app:user:updated', {user: res.json.user});
  } 
});
```

## Local proxies

Local proxies can be used to mock part or full data of a request.

API:

**request.on(pattern, inproxy)**

**pattern** : string or regex to match specific(s) url(s)
**inproxy** : function handler called with [client](https://github.com/IsCoolEntertainment/titanium-request/blob/master/lib/client.js) as unique argument

*Example : call only once each url, then return cache for all other calls*

```js

var cache = {};

request.on(/^.*$/, function (client) {
  if (cache.hasOwnProperty(client.url)) {
    client.send(null, cache[client.url]);
  } else {
    client.call(function (err, res) {
      if (!err) cache[client.url] = res;
      client.send(err, res);
    });
  }
});
```

## Cookies cache

By default cookies are not managed by request.
You need to activate it by register this middleware :

```js
request.use(request.middlewares.cookie());
```
 Requirements : [ti_touchdb](https://github.com/pegli/ti_touchdb)
