
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

  ticlient.onerror = this.errorcb(ticlient);
  ticlient.onload = this.successcb(ticlient) 
  ticlient.open(options.method, options.url, true);
  ticlient.send(options.data);
};

/* Error callback wrapper */

client.errorcb = function (ticlient) {
  return function (error) {
    options.callback(error, null);
  };
};

/* Success callback wrapper */

client.successcb = function (ticlient) {
  var that = this;

  return function () {
    options.callback(null, that.response(ticlient));
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
}

/* Response object factory */

client.response = function (ticlient) {

  return {
    code: ticlient.status,
    xml: ticlient.responseXML,
    blob: ticlient.responseData,
    text: ticlient.responseText,
    json: this.jobject(ticlient)
  }
};