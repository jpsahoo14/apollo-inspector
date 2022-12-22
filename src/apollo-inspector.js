"use strict";
exports.__esModule = true;
exports.ApolloInspector = void 0;
var apollo_inspector_utils_1 = require("./apollo-inspector-utils");
var extract_operations_1 = require("./extract-operations");
var apollo_inspector_helper_1 = require("./apollo-inspector-helper");
var ApolloInspector = /** @class */ (function () {
    function ApolloInspector(client) {
        this.client = client;
        this.isRecording = false;
    }
    ApolloInspector.prototype.startTracking = function (config) {
        var _this = this;
        if (this.isRecording == true) {
            throw new Error("Recording already in progress");
        }
        if (!config) {
            config = apollo_inspector_utils_1.defaultConfig;
        }
        this.setRecording(true);
        var dataSetters = (0, apollo_inspector_helper_1.initializeRawData)();
        var cleanUps = (0, apollo_inspector_helper_1.startRecordingInternal)({
            client: this.client,
            config: config,
            dataSetters: dataSetters
        });
        return function () {
            _this.setRecording(false);
            cleanUps.forEach(function (cleanup) {
                cleanup();
            });
            return (0, extract_operations_1.extractOperations)(dataSetters.getRawData());
        };
    };
    ApolloInspector.prototype.setRecording = function (isRecording) {
        this.isRecording = isRecording;
    };
    return ApolloInspector;
}());
exports.ApolloInspector = ApolloInspector;
