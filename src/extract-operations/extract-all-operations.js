"use strict";
exports.__esModule = true;
exports.extractAllOperationsData = void 0;
var graphql_1 = require("graphql");
var interfaces_1 = require("../interfaces");
var apollo_inspector_utils_1 = require("../apollo-inspector-utils");
var extractAllOperationsData = function (operations) {
    var allOperations = [];
    for (var key in operations) {
        if (operations.hasOwnProperty(key)) {
            var value = operations[key];
            var operation = getOperationWrapper(value);
            allOperations.push(operation);
        }
    }
    return allOperations;
};
exports.extractAllOperationsData = extractAllOperationsData;
var getOperation = function (_a) {
    var data = _a.data, operationType = _a.operationType;
    var query = data.query, result = data.result, variables = data.variables, isActive = data.isActive, error = data.error;
    var operationString = (0, graphql_1.print)(data.query);
    var operationName = (0, apollo_inspector_utils_1.getOperationName)(query);
    return {
        operationType: operationType,
        operationName: operationName,
        operationString: operationString,
        variables: variables,
        result: result,
        isActive: isActive,
        error: error
    };
};
var getOperationWrapper = function (data) {
    var dataId = data.dataId, query = data.query, variables = data.variables, result = data.result, error = data.error, isActive = data.isActive;
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
                result: result,
                error: error,
                isActive: isActive
            };
        }
    }
};
