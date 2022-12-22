"use strict";
exports.__esModule = true;
exports.overrideFetchQueryObservable = void 0;
var interfaces_1 = require("../../interfaces");
var overrideFetchQueryObservable = function (apolloClient, rawData, setVerboseApolloOperations) {
    var originalFetchQueryObservable = apolloClient.queryManager.fetchQueryObservable;
    apolloClient.queryManager.fetchQueryObservable =
        function override() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var queryId = args[0];
            var options = args[1];
            var _a = options.errorPolicy, errorPolicy = _a === void 0 ? "none" : _a;
            var fetchPolicy = options.fetchPolicy || "cache-first";
            var queryInfo = apolloClient.queryManager.getQuery(queryId);
            var nextId = ++rawData.operationIdCounter;
            rawData.enableDebug &&
                console.log("APD operationId:".concat(nextId, " fetchQueryObservable start queryId:").concat(queryId));
            setVerboseApolloOperations(function (opMap) {
                var _a;
                var debugOp = new interfaces_1.QueryOperation({
                    dataId: interfaces_1.DataId.ROOT_QUERY,
                    queryInfo: queryInfo,
                    variables: options.variables,
                    query: options.query,
                    operationId: nextId,
                    fetchPolicy: fetchPolicy,
                    debuggerEnabled: rawData.enableDebug || false,
                    errorPolicy: errorPolicy
                });
                opMap.set(nextId, debugOp);
                if (rawData.enableDebug &&
                    rawData.queryInfoToOperationId.get(queryInfo)) {
                    rawData.enableDebug &&
                        console.log("APD operationId:".concat((_a = rawData.queryInfoToOperationId.get(queryInfo)) === null || _a === void 0 ? void 0 : _a.id, " currentOperationId:").concat(nextId, " queryId:").concat(queryId, " "));
                    // debugger;
                }
                rawData.queryInfoToOperationId.set(queryInfo, debugOp);
            });
            rawData.currentOperationId = nextId;
            var observable = originalFetchQueryObservable.apply(this, args);
            rawData.currentOperationId = 0;
            var subscription = observable.subscribe({
                next: function (result) {
                    rawData.enableDebug &&
                        console.log("APD operationId:".concat(nextId, " fetchQueryObservable next"), result);
                    setVerboseApolloOperations(function (opMap) {
                        var op = opMap.get(nextId);
                        op === null || op === void 0 ? void 0 : op.addResult(result);
                    });
                },
                error: function (error) {
                    rawData.enableDebug &&
                        console.log("APD operationId:".concat(nextId, " fetchQueryObservable error"));
                    setVerboseApolloOperations(function (opMap) {
                        var op = opMap.get(nextId);
                        op === null || op === void 0 ? void 0 : op.addError(error);
                    });
                    subscription.unsubscribe();
                },
                complete: function () {
                    rawData.enableDebug &&
                        console.log("APD operationId:".concat(nextId, " fetchQueryObservable complete"));
                    subscription && subscription.unsubscribe();
                    setVerboseApolloOperations(function (opMap) {
                        var op = opMap.get(nextId);
                        op === null || op === void 0 ? void 0 : op.setInActive();
                    });
                }
            });
            observable.promise
                .then(function (result) {
                rawData.enableDebug &&
                    console.log("APD operationId:".concat(nextId, " fetchQueryObservable then"), result);
                setVerboseApolloOperations(function (opMap) {
                    var op = opMap.get(nextId);
                    op && (op.duration.operationExecutionEndTime = performance.now());
                });
            })["catch"](function () {
                rawData.enableDebug &&
                    console.log("APD operationId:".concat(nextId, " fetchQueryObservable catch"));
                setVerboseApolloOperations(function (opMap) {
                    var op = opMap.get(nextId);
                    op && (op.duration.operationExecutionEndTime = performance.now());
                });
            });
            return observable;
        };
    return function () {
        apolloClient.queryManager.fetchQueryObservable = originalFetchQueryObservable;
    };
};
exports.overrideFetchQueryObservable = overrideFetchQueryObservable;
