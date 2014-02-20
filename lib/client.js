
/*
 * Exports Client constructor
 */

var Client = module.exports = function () {
  if (!(this instanceof Client)) return new Client;
};

/* Simple Titanium HTTPClient constructor */

Client.ticlient = function (options) {
  return Ti.Network.createHTTPClient(options);
};


/*
 * Local Dependencies
 */

var client = Client.prototype;


/* HTTP request factory */

client.request = function (options) {
  var ticlient = Client.ticlient(options);

  this.opt = options;
  ticlient.onerror = this.errorcb(ticlient);
  ticlient.onload = this.successcb(ticlient) 
  ticlient.open(options.method, options.url, true);
  ticlient.send(options.data);
};

/* Error callback wrapper */

client.errorcb = function (ticlient) {
  var that = this;

  return function (error) {
    that.opt.callback(error, null);
  };
};

/* Success callback wrapper */

client.successcb = function (ticlient) {
  var that = this;

  return function () {
    that.opt.callback(null, that.response(ticlient));
  };
};

/* Try to parse text response, returns null */

client.jobject = function (ticlient) {
  var jobject = null;

  try {
    jobject = JSON.parse(ticlient.responseText);
  } catch (err) {
    if (this.debug) console.log(err);  
  }
  
  return jobject;  
};

/* Returns response headers as JSON object */

client.headers = function (ticlient) {
  var headers = {};

  if (!!ticlient.getResponseHeaders) {
    return ticlient.getResponseHeaders() || {};
  }

  if (!ticlient.getAllResponseHeaders) return {};

  ticlient.getAllResponseHeaders().split('\n').forEach(function (line) {
    var matchLine, matchName, matchValue;
    
    matchLine = line.match(/([^\:]*)\:(.*)/);
    if (!matchLine) return;

    matchName = matchLine[1].match(/\s*([^\s]{1}.*[^\s]{1})\s*/);
    if (!matchName) return;

    matchValue = matchLine[2].match(/\s*([^\s]{1}.*[^\s]{1})\s*/);
    if (!matchValue) return;

    headers[matchName[1]] = matchValue[1];
  });

  return headers;
};


/* Response object factory */

client.response = function (ticlient) {

  return {
    code: ticlient.status,
    xml: ticlient.responseXML,
    blob: ticlient.responseData,
    text: ticlient.responseText,
    json: this.jobject(ticlient),
    headers: this.headers(ticlient)
  }
};