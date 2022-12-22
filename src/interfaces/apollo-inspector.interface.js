"use strict";
exports.__esModule = true;
exports.ProdApolloClientId = exports.TabHeaders = exports.RecordOperationType = exports.Not_Available = exports.DataId = exports.OperationType = exports.THREE = exports.TWO = exports.ONE = exports.ResultsFrom = exports.OperationStage = exports.DebugState = void 0;
var DebugState;
(function (DebugState) {
    DebugState[DebugState["Initial"] = 0] = "Initial";
    DebugState[DebugState["StartedRecording"] = 1] = "StartedRecording";
    DebugState[DebugState["StoppedRecording"] = 2] = "StoppedRecording";
})(DebugState = exports.DebugState || (exports.DebugState = {}));
var OperationStage;
(function (OperationStage) {
    OperationStage["fetchQueryObservable"] = "fetchQueryObservable";
    OperationStage["linkExecutionStart"] = "linkExecutionStart";
    OperationStage["linkNextExecution"] = "linkNextExecution";
    OperationStage["markResultExecution"] = "markResultExecution";
    OperationStage["addedDataToCache"] = "addedDataToCache";
    OperationStage["cacheDiff"] = "cacheDiff";
    OperationStage["cacheBroadcastWatches"] = "cacheBroadcastWatches";
    OperationStage["linkCompleteExecution"] = "linkCompleteExecution";
})(OperationStage = exports.OperationStage || (exports.OperationStage = {}));
var ResultsFrom;
(function (ResultsFrom) {
    ResultsFrom["CACHE"] = "CACHE";
    ResultsFrom["NETWORK"] = "NETWORK";
    ResultsFrom["UNKNOWN"] = "UNKNOWN";
})(ResultsFrom = exports.ResultsFrom || (exports.ResultsFrom = {}));
exports.ONE = 1;
exports.TWO = 2;
exports.THREE = 3;
var OperationType;
(function (OperationType) {
    OperationType["Query"] = "Query";
    OperationType["Mutation"] = "Mutation";
    OperationType["Subscription"] = "Subscription";
    OperationType["Fragment"] = "Fragment";
    OperationType["Unknown"] = "Unknown";
})(OperationType = exports.OperationType || (exports.OperationType = {}));
var DataId;
(function (DataId) {
    DataId["ROOT_QUERY"] = "ROOT_QUERY";
    DataId["ROOT_MUTATION"] = "ROOT_MUTATION";
    DataId["ROOT_OPTIMISTIC_MUTATION"] = "ROOT_OPTIMISTIC_MUTATION";
    DataId["ROOT_SUBSCRIPTION"] = "ROOT_SUBSCRIPTION";
})(DataId = exports.DataId || (exports.DataId = {}));
exports.Not_Available = "Not Available";
var RecordOperationType;
(function (RecordOperationType) {
    RecordOperationType["AllOperations"] = "AllOperations";
    RecordOperationType["OnlyOperationsWhichWritesToCache"] = "OnlyOperationsWhichWritesToCache";
})(RecordOperationType = exports.RecordOperationType || (exports.RecordOperationType = {}));
var TabHeaders;
(function (TabHeaders) {
    TabHeaders[TabHeaders["AllOperationsView"] = 0] = "AllOperationsView";
    TabHeaders[TabHeaders["OperationsView"] = 1] = "OperationsView";
    TabHeaders[TabHeaders["VerboseOperationView"] = 2] = "VerboseOperationView";
    TabHeaders[TabHeaders["AffectedQueriesView"] = 3] = "AffectedQueriesView";
})(TabHeaders = exports.TabHeaders || (exports.TabHeaders = {}));
exports.ProdApolloClientId = "CurrentApolloClient";
