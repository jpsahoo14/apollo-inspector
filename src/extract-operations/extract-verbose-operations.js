"use strict";
exports.__esModule = true;
exports.extractVerboseOperationsData = void 0;
var extractVerboseOperationsData = function (operations) {
    var rawData = operations;
    var verboseOps = [];
    for (var _i = 0, rawData_1 = rawData; _i < rawData_1.length; _i++) {
        var _a = rawData_1[_i], _key = _a[0], value = _a[1];
        verboseOps.push(value.getOperationInfo());
    }
    verboseOps.sort(function (a, b) { return a.id - b.id; });
    return verboseOps;
};
exports.extractVerboseOperationsData = extractVerboseOperationsData;
