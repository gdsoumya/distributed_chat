"use strict";
/* eslint-disable max-classes-per-file */
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
exports.PrivateChannelClient = exports.PrivateMessageStage = void 0;
var immutable_1 = require("immutable");
var client_1 = require("./client");
var stage_1 = require("../stages/stage");
var register_1 = require("../stages/register");
var clientUtils_1 = require("../clientUtils");
var PrivateMessageStage = /** @class */ (function (_super) {
    __extends(PrivateMessageStage, _super);
    function PrivateMessageStage(toPublicKey, builder) {
        var _this = _super.call(this, 'privateMessage', builder) || this;
        _this.toPublicKey = toPublicKey;
        _this.sharedKey = function () { return _this.builder.getClientState().keyPair.getSharedKey(_this.toPublicKey); };
        return _this;
    }
    PrivateMessageStage.prototype.getSharedKey = function () {
        if (typeof this.sharedKey === 'function') {
            this.sharedKey = this.sharedKey();
        }
        return this.sharedKey;
    };
    PrivateMessageStage.prototype.sendServerCommand = function (connectionManager) {
        if (!this.builder.client.isMessageQueueEmpty()) {
            var first = this.builder.client.getFirstMessage();
            var sharedKey = this.getSharedKey();
            connectionManager.sendDatum({
                type: 'msg',
                msg: clientUtils_1.encryptJSON(first, sharedKey.bufferValue),
                fromPublicKey: this.builder.getClientState().keyPair.getPublicKey(),
                toPublicKey: this.toPublicKey,
            });
        }
    };
    PrivateMessageStage.prototype.parseReplyToNextBuilder = function (dataJSON) {
        if (dataJSON.type === 'success' || dataJSON.type === 'msg') {
            // go and send the next message in the queue
            this.builder.client.popFirstMessage();
            this.sendServerCommand(this.builder.getClientState().connectionManager);
        }
        else if (dataJSON.type === 'error') {
            console.error('failed to send a message'); // eslint-disable-line no-console
        }
        var sharedKey = this.getSharedKey();
        var decryptedJSON = (dataJSON.msg === 'MESSAGE SENT') ? dataJSON : JSON.parse(clientUtils_1.decryptHexString(dataJSON.msg || '', sharedKey.bufferValue));
        // stay in this stage forever
        // TODO make a disconnect stage if we want to allow human users
        // to stop this client politely.
        var currentStageCreator = this.builder.currentStageCreator;
        return this.builder.toNextBuilder(decryptedJSON, currentStageCreator);
    };
    return PrivateMessageStage;
}(stage_1.Stage));
exports.PrivateMessageStage = PrivateMessageStage;
var PrivateChannelClient = /** @class */ (function (_super) {
    __extends(PrivateChannelClient, _super);
    function PrivateChannelClient(counterParty, connMan, flushLimit, keyPair) {
        return _super.call(this, connMan, immutable_1.List([
            register_1.RequestChallengeStageCreator,
            function (builder) { return new PrivateMessageStage(counterParty, builder); },
        ]), flushLimit, keyPair) || this;
    }
    PrivateChannelClient.prototype.triggerQueueProcessing = function () {
        /*
        const stage = this.builder.getStage()
        if (stage instanceof PrivateMessageStage) {
          if ((this.messageQueue.count() >= this.flushLimit)
            && (this.sentCount >= this.ackedCount)) {
            // If we've reached the flush limit and are not already in the middle of sending,
            // kick off another round
            stage.sendServerCommand(this.builder.getClientState().connectionManager)
          }
        }
        */
        return this;
    };
    return PrivateChannelClient;
}(client_1.Client));
exports.PrivateChannelClient = PrivateChannelClient;
//# sourceMappingURL=privClient.js.map