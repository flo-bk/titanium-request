'use strict';

var errors = module.exports = {};

var RequestError = function(name, infos) {
    this.name = name;
    this.infos = infos || {};
}

RequestError.prototype = new Error();

RequestError.prototype.toString = function () {
    var infos = this.infos;
    var infosLine = Object.keys(infos).map(function (name) {
        return name + '=' + infos[name];
    }).join(';');


    return this.name + (infosLine.length > 0 ? ' : ' + infosLine : '');
};

RequestError.extend = function () {
    var args = Array.prototype.slice.call(arguments);
    var ErrorChild = function () {
        var childArgs = Array.prototype.slice.call(arguments);
        var name = args[0];
        var index = 1;
        var infos = {};

        for (index = 1; index < args.length; index++) {
            if (index - 1 < childArgs.length) {
                infos[args[index]] = childArgs[index - 1];
            }
        }

        RequestError.apply(this, [name, infos]);
    }

    ErrorChild.prototype = new RequestError();
    return ErrorChild;
};


errors.TimeoutError = RequestError.extend('TimeoutError', 'timeout');
errors.NoNetworkError = RequestError.extend('NoNetworkError');