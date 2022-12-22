"use strict";
exports.__esModule = true;
exports.extractCacheOperations = void 0;
var interfaces_1 = require("../interfaces");
var apollo_inspector_utils_1 = require("../apollo-inspector-utils");
var graphql_1 = require("graphql");
var extractCacheOperations = function (cacheOperations) {
    var operations = cacheOperations.map(function (data) {
        var dataId = data.dataId, query = data.query, variables = data.variables, result = data.result;
        switch (dataId) {
            case interfaces_1.DataId.ROOT_QUERY: {
                return getOperation({ data: data, operationType: interfaces_1.OperationType.Query });
            }
            case interfaces_1.DataId.ROOT_MUTATION: {
                return getOperation({ data: data, operationType: interfaces_1.OperationType.Mutation });
            }
            case interfaces_1.DataId.ROOT_SUBSCRIPTION: {
                return getOperation({
                    data: data,
                    operationType: interfaces_1.OperationType.Subscription
                });
            }
            case interfaces_1.DataId.ROOT_OPTIMISTIC_MUTATION: {
                return getOperation({
                    data: data,
                    operationType: interfaces_1.OperationType.Mutation
                });
            }
            default: {
                var operationName = dataId;
                var operationString = (0, graphql_1.print)(query);
                var operationType = interfaces_1.OperationType.Unknown;
                return {
                    operationType: operationType,
                    operationName: operationName,
                    operationString: operationString,
                    variables: variables,
                    result: result
                };
            }
        }
    });
    return operations;
};
exports.extractCacheOperations = extractCacheOperations;
var getOperation = function (_a) {
    var data = _a.data, operationType = _a.operationType;
    var query = data.query, result = data.result, variables = data.variables;
    var operationString = (0, graphql_1.print)(data.query);
    var operationName = (0, apollo_inspector_utils_1.getOperationNameV2)(query);
    return {
        operationType: operationType,
        operationName: operationName,
        operationString: operationString,
        variables: variables,
        result: result
    };
};
