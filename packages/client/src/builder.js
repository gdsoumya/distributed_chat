"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientStateBuilder = void 0;
var console_1 = require("console");
var client_1 = require("./clients/client");
// Builder for an immutable client state that
// mutually links with an immutable stage
var ClientStateBuilder = /** @class */ (function () {
    function ClientStateBuilder(keyPair, connectionManager, stageCreators, nextStageCreator, lastUserDatum, client) {
        var _this = this;
        if (nextStageCreator === void 0) { nextStageCreator = null; }
        /* eslint-disable max-len */
        var currentStageCreator = (nextStageCreator !== null) ? nextStageCreator : stageCreators.first();
        var remainingStageCreators = (nextStageCreator !== null) ? stageCreators : stageCreators.remove(0);
        /* eslint-enable max-len */
        var cs = new client_1.ClientState(keyPair, connectionManager, remainingStageCreators, lastUserDatum, this);
        this.lazyClientState = function () { return cs; };
        this.lazyStage = function () { return currentStageCreator(_this); };
        this.currentStageCreator = currentStageCreator;
        this.client = client;
    }
    ClientStateBuilder.prototype.getClientState = function () {
        var result = (typeof (this.lazyClientState) === 'function') ? this.lazyClientState(this.getStage()) : this.lazyClientState;
        this.lazyClientState = result;
        return result;
    };
    ClientStateBuilder.prototype.getStage = function () {
        var result = (typeof (this.lazyStage) === 'function') ? this.lazyStage(this) : this.lazyStage;
        this.lazyStage = result;
        return result;
    };
    ClientStateBuilder.prototype.startStage = function () {
        return this.getStage().start(this.getClientState().connectionManager);
    };
    ClientStateBuilder.prototype.toNextBuilder = function (lastUserDatum, _nextStageCreator) {
        var previousState = this.getClientState();
        var nextStageCreator = _nextStageCreator || previousState.remainingStageCreators.first();
        console_1.assert(typeof nextStageCreator === 'function', "no remaining stage creators from " + this.getStage().stageName);
        /* eslint-disable max-len */
        var remainingStageCreators = _nextStageCreator ? previousState.remainingStageCreators : previousState.remainingStageCreators.remove(0);
        /* eslint-enable max-len */
        var newBuilder = new ClientStateBuilder(previousState.keyPair, previousState.connectionManager, remainingStageCreators, nextStageCreator, lastUserDatum, previousState.builder.client);
        return newBuilder;
    };
    return ClientStateBuilder;
}());
exports.ClientStateBuilder = ClientStateBuilder;
exports.default = ClientStateBuilder;
//# sourceMappingURL=builder.js.map