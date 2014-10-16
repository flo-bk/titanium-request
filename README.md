# titanium-request

Titanium HTTP request library inspired by node and python equivalents

## Installation

Get the latest [dist/request.js](https://raw.github.com/IsCoolEntertainment/titanium-request/master/dist/request.js) into your __Resources__ folder or your __app/lib__ folder, if you're using __Alloy__.

## Base API

__request.get__(_url_, _callback_, [_options_])

__request.post__(_url_, _callback_, [_options_])

__request.put__(_url_, _callback_, [_options_])

__request.delete__(_url_, _callback_, [_options_])

## Example

```js
request.get('http://www.example.com', function (err, res) {
  if (res && res.json) console.log('Got JSON response :', res.json);
});
```

## Response Object

The response object is given as the second parameter of the callback, if no error occurred in the request.

* __res.code__: HTTP Status code
* __res.text__: Response as a __String__
* __res.blob__: Response in [Titanium.Blob](http://docs.appcelerator.com/titanium/latest/#!/api/Titanium.Blob) format
* __res.xml__: Response in [Titanium.XML.Document](http://docs.appcelerator.com/titanium/latest/#!/api/Titanium.XML.Document) format (_null_ if __res.text__ is not well-formed XML)
* __res.json__: Response as a __JSON__ object (_null_ if __res.text__ is unparseable JSON)
* __res.headers__: Response headers as a __JSON__ object

## Options

You can pass the following data through the _options_ object argument:

* Request headers
* Query string
* Request body

### Request Headers

The request headers are passed through _options.headers_ using an object with the header names as its properties, and the header values as its values.

```js
var headers = {
  'cookie': 'session=E8vh78'
};

request.post('http://www.example.com/article', function (err, res) {
  if (res && res.json) console.log('Got JSON response :', res.json);
}, {headers: headers});
```

### Query string

The query string is passed through _options.query_ using an object with the parameter names as its properties, and the parameter values as its values.

```js
request.get('http://www.example.com/article/5', function (err, res) {
  // this request will be called with the following URL :
  // http://www.example.com/article/5?foo=bar&bar=baz
}, {query : {foo: 'bar', bar: 'baz'}});
```

### Request body

The request body is passed through _options.body_ using either a String, an Object or a [Blob](http://docs.appcelerator.com/titanium/latest/#!/api/Titanium.Blob).

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

You can register a middleware if you want to execute some code

* before the request is sent
* before the response callback

*Example 1 : patch headers for all the requests*

```js
request.use(function (req, res) {
  if (!!res) return; // If res is filled, the request has already been sent
  req.headers['x-foo'] = 'bar';
});
```

*Example 2 : trigger event when user data is returned in the response*

```js
request.use(function (req, res) {
  if (!!res && !!res.json && !!res.json.user) {
    Ti.App.fireEvent('app:user:updated', {user: res.json.user});
  }
});
```

## Local proxies

Local proxies can be used to mock part or all the data of a request.

API:

**request.on**(_pattern_, _inproxy_)


_pattern_: String or Regex to match specific(s) url(s)

_inproxy_: function handler called with [client](https://github.com/IsCoolEntertainment/titanium-request/blob/master/lib/client.js) as unique argument

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
You need to activate it by registering this middleware:

```js
request.use(request.middlewares.cookie());
```
 Requirements : [ti_touchdb](https://github.com/pegli/ti_touchdb)
