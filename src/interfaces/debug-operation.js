"use strict";
exports.__esModule = true;
exports.IDebugOperation = void 0;
var apollo_inspector_interface_1 = require("./apollo-inspector.interface");
var graphql_1 = require("graphql");
var apollo_inspector_utils_1 = require("../apollo-inspector-utils");
var IDebugOperation = /** @class */ (function () {
    function IDebugOperation(_a) {
        var dataId = _a.dataId, query = _a.query, variables = _a.variables, operationId = _a.operationId, debuggerEnabled = _a.debuggerEnabled, errorPolicy = _a.errorPolicy;
        var _this = this;
        this.decimalNumber = 2;
        this.getTotalExecutionTime = function () {
            if (!_this.duration.totalExecutionTime) {
                if (_this.duration.operationExecutionEndTime &&
                    _this.duration.operationExecutionStartTime) {
                    var value = _this.duration.operationExecutionEndTime -
                        _this.duration.operationExecutionStartTime;
                    if (!isNaN(value)) {
                        _this.duration.totalExecutionTime = parseFloat(value.toFixed(_this.decimalNumber));
                    }
                }
            }
            return _this.duration.totalExecutionTime || apollo_inspector_interface_1.Not_Available;
        };
        if (operationId === 0) {
            debugger;
        }
        this._dataId = dataId;
        this._result = [];
        this.active = true;
        this.duration = {
            linkNextExecutionTime: [],
            operationExecutionStartTime: performance.now(),
            ipcTime: {}
        };
        this._query = query;
        this._variables = variables;
        this._id = operationId;
        this._affectedQueries = [];
        this.serverQuery = undefined;
        this.clientQuery = undefined;
        this.debuggerEnabled = debuggerEnabled;
        this.errorPolicy = errorPolicy;
        var val = false;
        if (val) {
            console.log({
                errorPolicy: this.errorPolicy
            });
        }
    }
    Object.defineProperty(IDebugOperation.prototype, "affectedQueries", {
        get: function () {
            return this._affectedQueries;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(IDebugOperation.prototype, "query", {
        get: function () {
            return this._query;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(IDebugOperation.prototype, "variables", {
        get: function () {
            return this._variables;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(IDebugOperation.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(IDebugOperation.prototype, "dataId", {
        get: function () {
            return this._dataId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(IDebugOperation.prototype, "result", {
        get: function () {
            return this._result;
        },
        enumerable: false,
        configurable: true
    });
    IDebugOperation.prototype.addError = function (error) {
        if (this.error) {
            debugger;
        }
        this.error = error;
    };
    IDebugOperation.prototype.setInActive = function () {
        this.active = false;
    };
    IDebugOperation.prototype.addAffectedQueries = function (queries) {
        this._affectedQueries = this._affectedQueries.concat(queries);
    };
    IDebugOperation.prototype.getOperationInfo = function () {
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
            fetchPolicy: undefined,
            warning: undefined,
            duration: undefined
        };
    };
    IDebugOperation.prototype.getOperationType = function () {
        switch (this._dataId) {
            case apollo_inspector_interface_1.DataId.ROOT_QUERY: {
                return apollo_inspector_interface_1.OperationType.Query;
            }
        }
        return apollo_inspector_interface_1.OperationType.Unknown;
    };
    return IDebugOperation;
}());
exports.IDebugOperation = IDebugOperation;
