"use strict";
exports.__esModule = true;
exports.extractOperations = void 0;
var extract_cache_operations_1 = require("./extract-cache-operations");
var extract_all_operations_1 = require("./extract-all-operations");
var extract_verbose_operations_1 = require("./extract-verbose-operations");
var extractOperations = function (rawData) {
    var result = {
        affectedQueriesOperations: null,
        allOperations: null,
        operations: null,
        verboseOperations: null
    };
    result.operations = (0, extract_cache_operations_1.extractCacheOperations)(rawData.operations);
    result.allOperations = (0, extract_all_operations_1.extractAllOperationsData)(rawData.allOperations);
    result.verboseOperations = (0, extract_verbose_operations_1.extractVerboseOperationsData)(rawData.verboseOperationsMap);
    return result;
};
exports.extractOperations = extractOperations;
