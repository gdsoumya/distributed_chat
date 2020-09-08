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
exports.PublicChannelClient = exports.JoinChannelStage = exports.PublicMessageStage = void 0;
var immutable_1 = require("immutable");
var client_1 = require("./client");
var stage_1 = require("../stages/stage");
var register_1 = require("../stages/register");
var PublicMessageStage = /** @class */ (function (_super) {
    __extends(PublicMessageStage, _super);
    function PublicMessageStage(channelName, userName, builder) {
        var _this = _super.call(this, 'publicMessage', builder) || this;
        _this.channelName = channelName;
        _this.userName = userName;
        _this.sentCount = 0;
        _this.ackedCount = 0;
        return _this;
    }
    PublicMessageStage.prototype.getSentCount = function () {
        return this.sentCount;
    };
    PublicMessageStage.prototype.getAckedCount = function () {
        return this.ackedCount;
    };
    PublicMessageStage.prototype.sendServerCommand = function (connectionManager) {
        if (!this.builder.client.isMessageQueueEmpty()) {
            var datum = this.builder.client.getFirstMessage();
            connectionManager.sendDatum({
                type: 'msg',
                userName: this.userName,
                channelName: this.channelName,
                msg: datum.msg,
                fromPublicKey: this.builder.getClientState().keyPair.getPublicKey(),
            });
            this.sentCount += 1;
        }
        // TODO: Sometimes we may wish to post anonymously to a public channel
    };
    PublicMessageStage.prototype.parseReplyToNextBuilder = function (dataJSON) {
        if (dataJSON.type === 'success') {
            this.ackedCount += 1;
            // if we've reached here, we've successfully sent the message
            // that was first in sendServerCommand
            this.builder.client.popFirstMessage();
            // keep emptying the queue
            this.sendServerCommand(this.builder.getClientState().connectionManager);
        }
        else if (dataJSON.type === 'error') {
            console.log('failed to send a message'); // eslint-disable-line no-console
        }
        // stay in this stage forever
        // TODO make a disconnect stage if we want to allow human users
        // to stop this client politely.
        return this.builder;
    };
    return PublicMessageStage;
}(stage_1.Stage));
exports.PublicMessageStage = PublicMessageStage;
var JoinChannelStage = /** @class */ (function (_super) {
    __extends(JoinChannelStage, _super);
    function JoinChannelStage(channelName, userName, builder) {
        var _this = _super.call(this, 'joinPublicChannel', builder) || this;
        _this.channelName = channelName;
        _this.userName = userName;
        return _this;
    }
    JoinChannelStage.prototype.sendServerCommand = function (connectionManager) {
        connectionManager.sendDatum({
            type: 'join',
            userName: this.userName,
            channelName: this.channelName,
            fromPublicKey: this.builder.getClientState().keyPair.getPublicKey(),
        });
    };
    JoinChannelStage.prototype.parseReplyToNextBuilder = function (dataJSON) {
        var _this = this;
        if (dataJSON.type === 'success') {
            console.log('server success received'); // eslint-disable-line no-console
            // We stay in this state indefinitely
            // TODO: allow enqueueUserDatum to send close command to server
            // and to handle here
            /* eslint-disable max-len */
            return this.builder.toNextBuilder(dataJSON, function (builder) { return new PublicMessageStage(_this.channelName, _this.userName, builder); });
            /* eslint-enable max-len */
        }
        console.error('Received unexpected message', JSON.stringify(dataJSON)); // eslint-disable-line no-console
        return this.builder;
    };
    return JoinChannelStage;
}(stage_1.Stage));
exports.JoinChannelStage = JoinChannelStage;
var PublicChannelClient = /** @class */ (function (_super) {
    __extends(PublicChannelClient, _super);
    function PublicChannelClient(channelName, userName, connMan, flushLimit, keyPair) {
        return _super.call(this, connMan, immutable_1.List([
            register_1.RequestChallengeStageCreator,
            function (builder) { return new JoinChannelStage(channelName, userName, builder); },
            function (builder) { return new PublicMessageStage(channelName, userName, builder); },
        ]), flushLimit, keyPair) || this;
    }
    PublicChannelClient.prototype.triggerQueueProcessing = function () {
        /*
        const stage = this.builder.getStage()
        if (stage instanceof PublicMessageStage) {
          if ((this.messageQueue.count() >= this.flushLimit)
            && (stage.getSentCount() === stage.getAckedCount())) {
            // If we've reached the flush limit and are not already in the middle of sending,
            // kick off another round
            stage.sendServerCommand(this.builder.getClientState().connectionManager)
          }
        }
        */
        return this;
    };
    return PublicChannelClient;
}(client_1.Client));
exports.PublicChannelClient = PublicChannelClient;
exports.default = PublicChannelClient;
//# sourceMappingURL=pubClient.js.map