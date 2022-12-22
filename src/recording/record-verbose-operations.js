"use strict";
exports.__esModule = true;
exports.recordVerboseOperations = void 0;
var record_verbose_operation_1 = require("./record-verbose-operation");
var recordVerboseOperations = function (client, setVerboseApolloOperations, rawData) {
    var selectedApolloClient = client;
    var revertSetTrackLink = (0, record_verbose_operation_1.setTrackLink)(selectedApolloClient, rawData, setVerboseApolloOperations);
    var revertFetchQueryObservable = (0, record_verbose_operation_1.overrideFetchQueryObservable)(selectedApolloClient, rawData, setVerboseApolloOperations);
    var revertMarkResult = (0, record_verbose_operation_1.overrideQueryInfoMarkResult)(selectedApolloClient, rawData, setVerboseApolloOperations);
    var revertFetchQueryByPolicy = (0, record_verbose_operation_1.overrideFetchQueryByPolicy)(selectedApolloClient, rawData, setVerboseApolloOperations);
    return function () {
        revertSetTrackLink();
        revertFetchQueryObservable();
        revertMarkResult();
        revertFetchQueryByPolicy();
    };
};
exports.recordVerboseOperations = recordVerboseOperations;
