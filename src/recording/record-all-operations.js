"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.recordAllOperations = void 0;
var interfaces_1 = require("../interfaces");
var lodash_1 = require("lodash");
var recordAllOperations = function (client, setAllApolloOperations) {
    var cleanUpFetchQueryObservable = trackFetchQueryObservable(client, setAllApolloOperations);
    var cleanUpMutate = trackClientMutateFn(client, setAllApolloOperations);
    return function () {
        cleanUpMutate();
        cleanUpFetchQueryObservable();
    };
};
exports.recordAllOperations = recordAllOperations;
var trackFetchQueryObservable = function (client, setAllApolloOperations) {
    var nextCount = 0;
    var errorCount = 0;
    var completeCount = 0;
    var count = 0;
    var originalFetchQueryObservable = client
        .queryManager.fetchQueryObservable;
    client.queryManager.fetchQueryObservable =
        function override() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var options = args[1];
            var observable = originalFetchQueryObservable.apply(this, args);
            var operationCount = count + 1;
            count++;
            setAllApolloOperations(function (state) {
                state[operationCount] = {
                    query: options.query,
                    variables: options.variables,
                    isActive: true,
                    dataId: interfaces_1.DataId.ROOT_QUERY
                };
            });
            var subscription = observable.subscribe({
                next: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    nextCount = nextCount + 1;
                    setAllApolloOperations(function (state) {
                        var prev = state[operationCount];
                        state[operationCount] = __assign(__assign({}, prev), { result: (0, lodash_1.cloneDeep)(args && args.length && args[0].data) });
                    });
                },
                error: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    errorCount = errorCount + 1;
                    subscription &&
                        subscription.unsubscribe &&
                        subscription.unsubscribe();
                    setAllApolloOperations(function (state) {
                        var prev = state[operationCount];
                        state[operationCount] = __assign(__assign({}, prev), { error: (0, lodash_1.cloneDeep)(args) });
                    });
                },
                complete: function () {
                    var _args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _args[_i] = arguments[_i];
                    }
                    completeCount = completeCount + 1;
                    subscription &&
                        subscription.unsubscribe &&
                        subscription.unsubscribe();
                    setAllApolloOperations(function (state) {
                        var prev = state[operationCount];
                        state[operationCount] = __assign(__assign({}, prev), { isActive: false });
                    });
                }
            });
            return observable;
        };
    return function () {
        client.queryManager.fetchQueryObservable =
            originalFetchQueryObservable;
    };
};
var trackClientMutateFn = function (client, setAllApolloOperations) {
    var lastPromise;
    var operationIndex = 100000;
    var originalMutateFn = client.mutate;
    client.mutate = function override() {
        var mutateArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            mutateArgs[_i] = arguments[_i];
        }
        var obj = mutateArgs[0];
        var mutation = obj.mutation, variables = obj.variables;
        var resultPromise = originalMutateFn.apply(this, mutateArgs);
        var setRawDataCb = function (result) {
            setAllApolloOperations(function (data) {
                data[operationIndex++] = {
                    dataId: interfaces_1.DataId.ROOT_MUTATION,
                    query: mutation,
                    variables: variables,
                    result: (0, lodash_1.cloneDeep)(result),
                    isActive: false
                };
                return data;
            });
        };
        if (lastPromise === undefined) {
            lastPromise = resultPromise;
        }
        lastPromise === null || lastPromise === void 0 ? void 0 : lastPromise.then(function () {
            resultPromise.then(function (result) {
                setRawDataCb(result);
            });
        })["catch"](function () {
            resultPromise.then(function (result) {
                setRawDataCb(result);
            });
        });
        lastPromise = resultPromise;
        return resultPromise;
    };
    return function () {
        client.mutate = originalMutateFn;
    };
};
