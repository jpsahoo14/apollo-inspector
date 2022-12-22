"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.QueryOperation = void 0;
var debug_operation_1 = require("./debug-operation");
var apollo_inspector_interface_1 = require("./apollo-inspector.interface");
var graphql_1 = require("graphql");
var apollo_inspector_utils_1 = require("../apollo-inspector-utils");
var lodash_1 = require("lodash");
var QueryOperation = /** @class */ (function (_super) {
    __extends(QueryOperation, _super);
    function QueryOperation(_a) {
        var dataId = _a.dataId, debuggerEnabled = _a.debuggerEnabled, errorPolicy = _a.errorPolicy, fetchPolicy = _a.fetchPolicy, operationId = _a.operationId, query = _a.query, queryInfo = _a.queryInfo, variables = _a.variables;
        var _this = _super.call(this, {
            dataId: dataId,
            debuggerEnabled: debuggerEnabled,
            errorPolicy: errorPolicy,
            operationId: operationId,
            query: query,
            variables: variables
        }) || this;
        _this.getResolverTime = function () {
            var _a;
            if (!_this.duration.totalResovlerTime &&
                ((_a = _this.duration.linkNextExecutionTime) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                if (_this.duration.linkEnterTime) {
                    var value = _this.duration.linkNextExecutionTime[0] - _this.duration.linkEnterTime;
                    if (!isNaN(value)) {
                        _this.duration.totalResovlerTime = parseFloat(value.toFixed(_this.decimalNumber));
                    }
                }
            }
            return (_this.duration.totalResovlerTime ||
                (_this.piggyBackOnExistingObservable ? "Multiplexed" : apollo_inspector_interface_1.Not_Available));
        };
        _this.getCacheWriteTime = function () {
            if (!_this.duration.totalCacheWriteTime) {
                if (_this.duration.cacheWriteEnd && _this.duration.cacheWriteStart) {
                    var value = _this.duration.cacheWriteEnd - _this.duration.cacheWriteStart;
                    if (!isNaN(value)) {
                        _this.duration.totalCacheWriteTime = parseFloat(value.toFixed(_this.decimalNumber));
                    }
                }
            }
            return _this.duration.totalCacheWriteTime || apollo_inspector_interface_1.Not_Available;
        };
        _this.getCacheDiffTime = function () {
            if (!_this.duration.totalCacheDiffTime) {
                if (_this.duration.cacheDiffEnd && _this.duration.cacheDiffStart) {
                    var value = _this.duration.cacheDiffEnd - _this.duration.cacheDiffStart;
                    if (!isNaN(value)) {
                        _this.duration.totalCacheDiffTime = parseFloat(value.toFixed(_this.decimalNumber));
                    }
                }
            }
            return _this.duration.totalCacheDiffTime || apollo_inspector_interface_1.Not_Available;
        };
        _this.getCacheBroadcastWatchesTime = function () {
            if (!_this.duration.totalCacheBroadcastWatchesTime) {
                if (_this.duration.cacheBroadcastWatchesEnd &&
                    _this.duration.cacheBroadcastWatchesStart) {
                    var value = _this.duration.cacheBroadcastWatchesEnd -
                        _this.duration.cacheBroadcastWatchesStart;
                    if (!isNaN(value)) {
                        _this.duration.totalCacheBroadcastWatchesTime = parseFloat(value.toFixed(_this.decimalNumber));
                    }
                }
            }
            return _this.duration.totalCacheBroadcastWatchesTime || apollo_inspector_interface_1.Not_Available;
        };
        _this.getWindowToWorkerIpcTime = function () {
            if (!_this.duration.totalWindowToWorkerIpcTime) {
                if (_this.duration.ipcTime.workerToWindowRequestReceiveTime &&
                    _this.duration.ipcTime.windowToWorkerRequestSendTime) {
                    var value = _this.duration.ipcTime.workerToWindowRequestReceiveTime -
                        _this.duration.ipcTime.windowToWorkerRequestSendTime;
                    if (!isNaN(value)) {
                        _this.duration.totalWindowToWorkerIpcTime = parseFloat(value.toFixed(_this.decimalNumber));
                    }
                }
            }
            return _this.duration.totalWindowToWorkerIpcTime || apollo_inspector_interface_1.Not_Available;
        };
        _this.getWorkerToWindowIpcTime = function () {
            if (!_this.duration.totalWorkerToWindowIpcTime) {
                if (_this.duration.ipcTime.windowToWorkerRequestReceviedTime &&
                    _this.duration.ipcTime.workerToWindowRequestSendTime) {
                    var value = _this.duration.ipcTime.windowToWorkerRequestReceviedTime -
                        _this.duration.ipcTime.workerToWindowRequestSendTime;
                    if (!isNaN(value)) {
                        _this.duration.totalWorkerToWindowIpcTime = parseFloat(value.toFixed(_this.decimalNumber));
                    }
                }
            }
            return _this.duration.totalWorkerToWindowIpcTime || apollo_inspector_interface_1.Not_Available;
        };
        _this.getIpcTime = function () {
            if (!_this.duration.totalIPCTime) {
                if (_this.duration.linkNextExecutionTime[0] &&
                    _this.duration.linkEnterTime &&
                    _this.duration.ipcTime.workerResponseTime) {
                    var value = _this.duration.linkNextExecutionTime[0] -
                        _this.duration.linkEnterTime -
                        _this.duration.ipcTime.workerResponseTime;
                    if (!isNaN(value)) {
                        _this.duration.totalIPCTime = parseFloat(value.toFixed(_this.decimalNumber));
                    }
                }
            }
            return _this.duration.totalIPCTime || apollo_inspector_interface_1.Not_Available;
        };
        _this.queryInfo = queryInfo;
        _this.fetchPolicy = fetchPolicy;
        _this._operationStage = apollo_inspector_interface_1.OperationStage.fetchQueryObservable;
        _this._operationStages = [apollo_inspector_interface_1.OperationStage.fetchQueryObservable];
        _this.deduplication = true;
        _this.piggyBackOnExistingObservable = false;
        var val = false;
        if (val) {
            console.log({
                queryInfo: _this.queryInfo
            });
        }
        return _this;
    }
    Object.defineProperty(QueryOperation.prototype, "operationStage", {
        get: function () {
            return this._operationStage;
        },
        enumerable: false,
        configurable: true
    });
    QueryOperation.prototype.addResult = function (result) {
        var _a, _b;
        var clonedResult = (0, lodash_1.cloneDeep)(result);
        switch (this.fetchPolicy) {
            case "cache-first": {
                if ((_a = this.diff) === null || _a === void 0 ? void 0 : _a.complete) {
                    this._result.push({ from: apollo_inspector_interface_1.ResultsFrom.CACHE, result: clonedResult });
                }
                else {
                    this._result.push({
                        from: apollo_inspector_interface_1.ResultsFrom.NETWORK,
                        result: clonedResult
                    });
                }
                return;
            }
            case "cache-and-network": {
                if (this.result.length === 0 && ((_b = this.diff) === null || _b === void 0 ? void 0 : _b.complete)) {
                    this._result.push({ from: apollo_inspector_interface_1.ResultsFrom.CACHE, result: clonedResult });
                }
                else {
                    this._result.push({
                        from: apollo_inspector_interface_1.ResultsFrom.NETWORK,
                        result: clonedResult
                    });
                }
                return;
            }
            case "cache-only": {
                this._result.push({ from: apollo_inspector_interface_1.ResultsFrom.CACHE, result: clonedResult });
                return;
            }
            case "network-only":
            case "no-cache": {
                this._result.push({ from: apollo_inspector_interface_1.ResultsFrom.NETWORK, result: clonedResult });
                return;
            }
        }
        debugger;
        this._result.push({ from: apollo_inspector_interface_1.ResultsFrom.UNKNOWN, result: clonedResult });
    };
    QueryOperation.prototype.setOperationStage = function (opStage) {
        switch (opStage) {
            case apollo_inspector_interface_1.OperationStage.fetchQueryObservable:
                break;
            case apollo_inspector_interface_1.OperationStage.linkExecutionStart:
                {
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.fetchQueryObservable);
                }
                break;
            case apollo_inspector_interface_1.OperationStage.linkNextExecution:
                {
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.fetchQueryObservable);
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.linkExecutionStart);
                    if (this._operationStage !== apollo_inspector_interface_1.OperationStage.linkExecutionStart) {
                        debugger;
                    }
                }
                break;
            case apollo_inspector_interface_1.OperationStage.markResultExecution:
                {
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.fetchQueryObservable);
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.linkExecutionStart);
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.linkNextExecution);
                }
                break;
            case apollo_inspector_interface_1.OperationStage.addedDataToCache:
                {
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.fetchQueryObservable);
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.linkExecutionStart);
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.linkNextExecution);
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.markResultExecution);
                }
                break;
            case apollo_inspector_interface_1.OperationStage.linkCompleteExecution:
                {
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.fetchQueryObservable);
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.linkExecutionStart);
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.linkNextExecution);
                    this.doesOperationExist(apollo_inspector_interface_1.OperationStage.markResultExecution);
                    this.fetchPolicy !== "no-cache" &&
                        this.doesOperationExist(apollo_inspector_interface_1.OperationStage.addedDataToCache);
                }
                break;
        }
        this.debuggerEnabled &&
            console.log("APD operationId:".concat(this._id, " operationStage: ").concat(opStage));
        this._operationStage = opStage;
        this._operationStages.push(opStage);
    };
    QueryOperation.prototype.getOperationInfo = function () {
        var operationName = (0, apollo_inspector_utils_1.getOperationNameV2)(this._query);
        var operationString = (0, graphql_1.print)(this._query);
        return {
            id: this._id,
            operationType: this.getOperationType(),
            operationName: operationName,
            operationString: operationString,
            variables: this._variables,
            result: this._result,
            affectedQueries: this._affectedQueries,
            isActive: this.active,
            error: this.error,
            fetchPolicy: this.fetchPolicy,
            warning: this.getWarning(),
            duration: {
                totalTime: this.getTotalExecutionTime(),
                cacheWriteTime: this.getCacheWriteTime(),
                resolverTime: this.getResolverTime(),
                cacheDiffTime: this.getCacheDiffTime(),
                cacheBroadcastWatchesTime: this.getCacheBroadcastWatchesTime(),
                windowToWorkerIpcTime: this.getWindowToWorkerIpcTime(),
                workerToWindowIpcTime: this.getWorkerToWindowIpcTime(),
                ipcTime: this.getIpcTime(),
                timeSpentInWorker: this.getTimeSpentInWorker()
            }
        };
    };
    QueryOperation.prototype.doesOperationExist = function (opStage) {
        var result = this._operationStages.find(function (op) { return op === opStage; });
        if (result === undefined) {
            // debugger;
            return false;
        }
        return true;
    };
    QueryOperation.prototype.getWarning = function () {
        if (this.diff && !this.diff.complete) {
            var msgs_1 = [];
            this.diff.missing.forEach(function (m) {
                msgs_1.push({ message: m.message, path: m.path });
            });
            return msgs_1;
        }
        return undefined;
    };
    QueryOperation.prototype.getTimeSpentInWorker = function () {
        if (!this.duration.totalTimeSpentInWorker) {
            var value = this.duration.ipcTime.workerResponseTime;
            if (value && !isNaN(value)) {
                this.duration.totalTimeSpentInWorker = parseFloat(value.toFixed(this.decimalNumber));
            }
        }
        return this.duration.totalTimeSpentInWorker || apollo_inspector_interface_1.Not_Available;
    };
    return QueryOperation;
}(debug_operation_1.IDebugOperation));
exports.QueryOperation = QueryOperation;
