module.exports = {
  status: 200,
  responseXML: null,
  responseData: null,
  responseText: '{"data": ["foobar", 42]}',
  getAllResponseHeaders: function () {
    return '  Date:Thu, 20 Feb 2014 14:09:11 GMT\n   ' +
        'Expires:-1\n' +
        'Cache-Control:private, max-age=0\n' +
        'Content-Type:text/html; charset=ISO-8859-1\n' +
        'Server:gws\n' +
        'X-XSS-Protection:1; mode=block     \n' +
        'X-Frame-Options:SAMEORIGIN  \n' +
        '   Alternate-Protocol:80:quic\n' +
        '  Transfer-Encoding:chunked   \n' +
        'set-cookie: session=AFLKaio5;Path=/';
  }
};