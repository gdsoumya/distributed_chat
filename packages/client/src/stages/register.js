"use strict";
// Common stages for registering a client
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
exports.RequestChallengeStageCreator = exports.RequestChallengeStage = exports.SignChallengeStage = void 0;
/* eslint-disable max-classes-per-file */
var chai_1 = require("chai");
var stage_1 = require("./stage");
var SignChallengeStage = /** @class */ (function (_super) {
    __extends(SignChallengeStage, _super);
    function SignChallengeStage(challengeSig, builder) {
        var _this = _super.call(this, 'signChallenge', builder) || this;
        _this.challengeSig = challengeSig;
        return _this;
    }
    SignChallengeStage.prototype.sendServerCommand = function () {
        chai_1.assert(this.builder.getClientState().remainingStageCreators.count() >= 1, 'No remaining stage creators from SIGN CHALLENGE');
        this.builder.getClientState().connectionManager.sendDatum({
            type: 'verify',
            fromPublicKey: this.builder.getClientState().keyPair.getPublicKey(),
            msg: this.challengeSig.toHexString(),
        });
    };
    SignChallengeStage.prototype.parseReplyToNextBuilder = function (datum) {
        if (datum.type === 'success') {
            /* eslint-disable no-console */
            console.log("Successfully connected client " + this.builder.getClientState().keyPair.getPublicKey().toHexString());
            /* eslint-enable no-console */
            return this.builder.toNextBuilder(datum);
        }
        /* eslint-disable no-console */
        console.error('Received unexpected message', JSON.stringify(datum));
        /* eslint-enable no-console */
        return this.builder;
    };
    return SignChallengeStage;
}(stage_1.Stage));
exports.SignChallengeStage = SignChallengeStage;
var RequestChallengeStage = /** @class */ (function (_super) {
    __extends(RequestChallengeStage, _super);
    function RequestChallengeStage(builder) {
        return _super.call(this, 'requestChallenge', builder) || this;
    }
    RequestChallengeStage.prototype.sendServerCommand = function () {
        this.builder.getClientState().connectionManager.sendDatum({
            type: 'connect',
            fromPublicKey: this.builder.getClientState().keyPair.getPublicKey(),
        });
    };
    RequestChallengeStage.prototype.parseReplyToNextBuilder = function (datum) {
        if (datum.type === 'verify') {
            if (!datum.msg) {
                throw new Error('Null msg for signing in RequestChallengeStage.');
            }
            var challengeSig_1 = this.builder.getClientState().keyPair.sign(datum.msg);
            console.log('server success received, challengeSig ', challengeSig_1); // eslint-disable-line no-console
            /* eslint-disable max-len */
            return this.builder.toNextBuilder(datum, function (builder) { return new SignChallengeStage(challengeSig_1, builder); });
            /* eslint-disable max-len */
        }
        console.error('RequestChallenge: Received unexpected message', JSON.stringify(datum));
        return this.builder;
    };
    return RequestChallengeStage;
}(stage_1.Stage));
exports.RequestChallengeStage = RequestChallengeStage;
exports.RequestChallengeStageCreator = function (builder) { return new RequestChallengeStage(builder); };
//# sourceMappingURL=register.js.map