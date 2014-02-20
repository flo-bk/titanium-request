module.exports = {
  status: 200,
  responseXML: null,
  responseData: null,
  responseText: '{"data": ["foobar", 42]}',
  getAllResponseHeaders: function () {
    return {'set-cookie': 'foobar=42'};
  }
};