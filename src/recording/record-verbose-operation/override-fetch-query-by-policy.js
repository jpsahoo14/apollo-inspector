"use strict";
exports.__esModule = true;
exports.overrideFetchQueryByPolicy = void 0;
var overrideFetchQueryByPolicy = function (apolloClient, rawData, setVerboseApolloOperations) {
    var map = {};
    var originalFetchQueryByPolicy = apolloClient
        .queryManager.fetchQueryByPolicy;
    apolloClient.queryManager.fetchQueryByPolicy =
        function override() {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var queryInfo = args[0];
            var options = args[1];
            var variables = options.variables, fetchPolicy = options.fetchPolicy;
            var operationId = rawData.currentOperationId;
            rawData.enableDebug &&
                console.log("APD operationId:".concat(operationId, " fetchQueryByPolicy queryId:").concat((_a = queryInfo.observableQuery) === null || _a === void 0 ? void 0 : _a.queryId, " fetchPolicy:").concat(fetchPolicy));
            if (rawData.enableDebug && operationId !== 0 && map[operationId]) {
                debugger;
            }
            map[operationId] = true;
            var result = originalFetchQueryByPolicy.apply(this, args);
            var diff = queryInfo.getDiff(variables);
            setVerboseApolloOperations(function (opMap) {
                var op = opMap.get(operationId);
                if (op) {
                    if (rawData.enableDebug && op.fetchPolicy !== fetchPolicy) {
                        debugger;
                    }
                    op.fetchPolicy = fetchPolicy;
                    op.diff = diff;
                }
            });
            return result;
        };
    return function () {
        apolloClient.queryManager.fetchQueryByPolicy =
            originalFetchQueryByPolicy;
    };
};
exports.overrideFetchQueryByPolicy = overrideFetchQueryByPolicy;
