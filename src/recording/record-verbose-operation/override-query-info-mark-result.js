"use strict";
exports.__esModule = true;
exports.overrideQueryInfoMarkResult = void 0;
var interfaces_1 = require("../../interfaces");
var overrideQueryInfoMarkResult = function (apolloClient, rawData, _setVerboseApolloOperations) {
    var revertExistingQueries = overrideForExistingQueries(apolloClient, rawData);
    var revertNewQuerie = overrideForNewQueries(apolloClient, rawData);
    return function () {
        revertExistingQueries();
        revertNewQuerie();
    };
};
exports.overrideQueryInfoMarkResult = overrideQueryInfoMarkResult;
var overrideForExistingQueries = function (apolloClient, rawData) {
    var existingWatchQueriesMap = apolloClient.queryManager.queries;
    var cachedOriginalFns = new Map();
    var _loop_1 = function (key, value) {
        var originalMarkResult = value.markResult;
        cachedOriginalFns.set(key, { queryInfo: value, originalMarkResult: originalMarkResult });
        value.markResult = function override() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var data = args[0];
            var self = this;
            var debugOperation = rawData.queryInfoToOperationId.get(self);
            if (rawData.enableDebug &&
                debugOperation &&
                data.operationId !== debugOperation.id) {
                debugger;
            }
            rawData.currentOperationId = (debugOperation === null || debugOperation === void 0 ? void 0 : debugOperation.id) || 0;
            rawData.enableDebug &&
                console.log("APD operationId:".concat(rawData.currentOperationId, " markResult"));
            debugOperation === null || debugOperation === void 0 ? void 0 : debugOperation.setOperationStage(interfaces_1.OperationStage.markResultExecution);
            var result = originalMarkResult.apply(self, args);
            rawData.currentOperationId = 0;
            var affectedQueries = getAffectedQueries(apolloClient);
            debugOperation === null || debugOperation === void 0 ? void 0 : debugOperation.addAffectedQueries(affectedQueries);
            return result;
        };
    };
    for (var _i = 0, existingWatchQueriesMap_1 = existingWatchQueriesMap; _i < existingWatchQueriesMap_1.length; _i++) {
        var _a = existingWatchQueriesMap_1[_i], key = _a[0], value = _a[1];
        _loop_1(key, value);
    }
    return function () {
        for (var _i = 0, cachedOriginalFns_1 = cachedOriginalFns; _i < cachedOriginalFns_1.length; _i++) {
            var _a = cachedOriginalFns_1[_i], _key = _a[0], value = _a[1];
            var queryInfo = value.queryInfo, originalMarkResult = value.originalMarkResult;
            queryInfo.markResult = originalMarkResult;
        }
    };
};
var overrideForNewQueries = function (apolloClient, rawData) {
    var originalWatchQueriesMap = apolloClient
        .queryManager.queries;
    var cachedOriginalFns = new Map();
    var handler = {
        set: function (target, key, value) {
            return Reflect.set(target, key, value);
        },
        get: function (target, key) {
            var _this = this;
            var ret = Reflect.get(target, key);
            if (typeof ret === "function") {
                ret = ret.bind(target);
            }
            if (key === "set") {
                var originalSetFn_1 = ret;
                ret = function (key, value) {
                    var orignalMarkResult = value.markResult;
                    cachedOriginalFns.set(key, {
                        queryInfo: value,
                        originalMarkResult: orignalMarkResult
                    });
                    value.markResult = function override() {
                        var arg = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            arg[_i] = arguments[_i];
                        }
                        var data = arg[0];
                        var self = this;
                        var debugOperation = rawData.queryInfoToOperationId.get(self);
                        if (rawData.enableDebug &&
                            debugOperation &&
                            data.operationId !== debugOperation.id) {
                            debugger;
                        }
                        rawData.enableDebug &&
                            console.log("APD operationId:".concat((debugOperation === null || debugOperation === void 0 ? void 0 : debugOperation.id) || 0, " markResult"));
                        rawData.currentOperationId = (debugOperation === null || debugOperation === void 0 ? void 0 : debugOperation.id) || 0;
                        debugOperation === null || debugOperation === void 0 ? void 0 : debugOperation.setOperationStage(interfaces_1.OperationStage.markResultExecution);
                        var result = orignalMarkResult.apply(this, arg);
                        rawData.currentOperationId = 0;
                        var affectedQueries = getAffectedQueries(apolloClient);
                        debugOperation === null || debugOperation === void 0 ? void 0 : debugOperation.addAffectedQueries(affectedQueries);
                        return result;
                    };
                    originalSetFn_1.call(_this, key, value);
                };
            }
            return ret;
        }
    };
    var proxy = new Proxy(originalWatchQueriesMap, handler);
    apolloClient.queryManager.queries = proxy;
    return function () {
        apolloClient.queryManager.queries =
            originalWatchQueriesMap;
        for (var _i = 0, cachedOriginalFns_2 = cachedOriginalFns; _i < cachedOriginalFns_2.length; _i++) {
            var _a = cachedOriginalFns_2[_i], _key = _a[0], value = _a[1];
            var queryInfo = value.queryInfo, originalMarkResult = value.originalMarkResult;
            queryInfo.markResult = originalMarkResult;
        }
    };
};
var getAffectedQueries = function (client) {
    var watchQueries = client.queryManager
        .queries;
    var affectedQueries = [];
    for (var _i = 0, watchQueries_1 = watchQueries; _i < watchQueries_1.length; _i++) {
        var _a = watchQueries_1[_i], _key = _a[0], value = _a[1];
        if (value.dirty === true) {
            affectedQueries.push(value.document);
        }
    }
    return affectedQueries;
};
