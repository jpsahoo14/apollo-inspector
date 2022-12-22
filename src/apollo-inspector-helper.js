"use strict";
exports.__esModule = true;
exports.startRecordingInternal = exports.initializeRawData = void 0;
var recording_1 = require("./recording");
var initializeRawData = function () {
    var rawData = {
        operations: [],
        verboseOperationsMap: new Map(),
        allOperations: {},
        mutationToMutationId: new Map(),
        operationIdToApolloOpId: new Map(),
        queryInfoToOperationId: new Map(),
        currentOperationId: 0,
        operationIdCounter: 0,
        enableDebug: false
    };
    var getRawData = function () { return rawData; };
    return {
        getRawData: getRawData,
        setCacheOperations: getSetCacheOperations(getRawData()),
        setAllOperations: getSetAllOperations(getRawData()),
        setVerboseOperations: getSetVerboseOperations(getRawData())
    };
};
exports.initializeRawData = initializeRawData;
var getSetCacheOperations = function (rawData) {
    return function (updateData) {
        if (typeof updateData === "function") {
            updateData(rawData.operations);
            return;
        }
        rawData.operations = updateData;
    };
};
var getSetAllOperations = function (rawData) {
    return function (updateData) {
        if (typeof updateData === "function") {
            updateData(rawData.allOperations);
            return;
        }
        rawData.allOperations = updateData;
    };
};
var getSetVerboseOperations = function (rawData) {
    return function (updateData) {
        if (typeof updateData === "function") {
            updateData(rawData.verboseOperationsMap);
            return;
        }
        rawData.verboseOperationsMap = updateData;
    };
};
var startRecordingInternal = function (_a) {
    var client = _a.client, config = _a.config, dataSetters = _a.dataSetters;
    var cleanups = [];
    if (config.trackCacheOperation) {
        var cleanUpWriteToCache = (0, recording_1.recordOnlyWriteToCacheOperations)(client, dataSetters.setCacheOperations);
        cleanups.push(cleanUpWriteToCache);
    }
    if (config.trackAllOperations) {
        var cleanUpAllOperation = (0, recording_1.recordAllOperations)(client, dataSetters.setAllOperations);
        cleanups.push(cleanUpAllOperation);
    }
    var cleanUpVerboseOperations = (0, recording_1.recordVerboseOperations)(client, dataSetters.setVerboseOperations, dataSetters.getRawData());
    cleanups.push(cleanUpVerboseOperations);
    return cleanups;
};
exports.startRecordingInternal = startRecordingInternal;
