"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorStageCreator = exports.Stage = void 0;
/**
 * A Stage is a state in a client protocol interaction,
 * similar to a finite-state-automaton, except that it
 * first emits a datum to the server, and waits / processes the
 * response.
 *
 * When processing the response, and then possibly updates the client state,
 * including creating a new stage and popping the next stage
 * creator in the queue.

 * Stages have access to a parent clientState from when they
 * were created, which they can reference in
 */
var Stage = /** @class */ (function () {
    /**
     * Construct a new Client pipeline stage
     * @arg stageName a unique name identifying this stage
     * @arg clientState the client state when this stage was created,
     * i.e. at the end of the previous stage.
     */
    function Stage(stageName, builder) {
        this.stageName = stageName;
        this.builder = builder;
    }
    Stage.prototype.start = function (connMan) {
        this.sendServerCommand(connMan);
    };
    return Stage;
}());
exports.Stage = Stage;
var ErrorStage = /** @class */ (function (_super) {
    __extends(ErrorStage, _super);
    function ErrorStage(builder) {
        var _this = _super.call(this, 'ErrorStage', builder) || this;
        throw new Error("ErrorStage: we've run out of StageCreators in your protocol.");
        return _this;
    }
    ErrorStage.prototype.sendServerCommand = function () {
        throw new Error("ErrorStage: we've run out of StageCreators with builder " + this.builder);
    };
    ErrorStage.prototype.parseReplyToNextBuilder = function (serverDatum) {
        throw new Error("ErrorStage: we've run out of StageCreators with builder " + this.builder
            + ("when receiving datum " + serverDatum));
    };
    return ErrorStage;
}(Stage));
/* eslint-disable max-len */
exports.ErrorStageCreator = function (builder) { return new ErrorStage(builder); };
//# sourceMappingURL=stage.js.map