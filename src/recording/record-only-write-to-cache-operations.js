"use strict";
exports.__esModule = true;
exports.recordOnlyWriteToCacheOperations = void 0;
var lodash_1 = require("lodash");
var recordOnlyWriteToCacheOperations = function (client, setApolloOperations) {
    var cache = client.cache;
    var originalFn = cache.write;
    cache.write = function override() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        setApolloOperations(function (data) {
            data.push((0, lodash_1.cloneDeep)(args[0]));
            return data;
        });
        var result = originalFn.apply(this, args);
        return result;
    };
    return function () {
        cache.write = originalFn;
    };
};
exports.recordOnlyWriteToCacheOperations = recordOnlyWriteToCacheOperations;
