"use strict";
exports.__esModule = true;
exports.setTrackLink = void 0;
var client_1 = require("@apollo/client");
var interfaces_1 = require("../../interfaces");
var setTrackLink = function (apolloClient, rawData, setVerboseApolloOperations) {
    var map = {};
    var trackLink = new client_1.ApolloLink(function (operation, forward) {
        var operationId = rawData.currentOperationId;
        if (rawData.enableDebug && operationId !== 0 && map[operationId]) {
            debugger;
        }
        map[operationId] = true;
        rawData.enableDebug &&
            console.log("APD operationId:".concat(operationId, " set-track-link"));
        var linkEnterTime = performance.now();
        setVerboseApolloOperations(function (opMap) {
            var op = opMap.get(operationId);
            op && (op.duration.linkEnterTime = linkEnterTime);
        });
        return new client_1.Observable(function (observer) {
            var linkExecutionStartTime = performance.now();
            rawData.enableDebug &&
                console.log("APD operationId:".concat(operationId, " linkExecutionStart"));
            setVerboseApolloOperations(function (opMap) {
                var op = opMap.get(operationId);
                if (op) {
                    op.duration.linkExecutionStartTime = linkExecutionStartTime;
                    op.setOperationStage(interfaces_1.OperationStage.linkExecutionStart);
                }
            });
            var observable = forward(operation);
            var subscription = observable.subscribe({
                next: function (result) {
                    var linkNextExecutionTime = performance.now();
                    setVerboseApolloOperations(function (opMap) {
                        var _a;
                        rawData.enableDebug &&
                            console.log("APD operationId:".concat(operationId, " linkNextExecution"), result);
                        var op = opMap.get(operationId);
                        if (op) {
                            (_a = op.duration.linkNextExecutionTime) === null || _a === void 0 ? void 0 : _a.push(linkNextExecutionTime);
                            op.setOperationStage(interfaces_1.OperationStage.linkNextExecution);
                        }
                    });
                    !observer.closed &&
                        observer.next(result);
                },
                error: function (error) {
                    rawData.enableDebug &&
                        console.log("APD operationId:".concat(operationId, " linkErrorExecutionTime"));
                    var linkErrorExecutionTime = performance.now();
                    setVerboseApolloOperations(function (opMap) {
                        var op = opMap.get(operationId);
                        op && (op.duration.linkErrorExecutionTime = linkErrorExecutionTime);
                    });
                    !observer.closed && observer.error(error);
                    subscription.unsubscribe();
                },
                complete: function () {
                    rawData.enableDebug &&
                        console.log("APD operationId:".concat(operationId, " linkCompleteExecution"));
                    var linkCompleteExecutionTime = performance.now();
                    setVerboseApolloOperations(function (opMap) {
                        var op = opMap.get(operationId);
                        if (op) {
                            op.duration.linkCompleteExecutionTime = linkCompleteExecutionTime;
                            op.setOperationStage(interfaces_1.OperationStage.linkCompleteExecution);
                        }
                    });
                    !observer.closed && observer.complete();
                }
            });
        });
    });
    var currentLink = apolloClient.link;
    var combinedLink = client_1.ApolloLink.concat(trackLink, currentLink);
    apolloClient.setLink(combinedLink);
    return function () {
        apolloClient.setLink(currentLink);
    };
};
exports.setTrackLink = setTrackLink;
