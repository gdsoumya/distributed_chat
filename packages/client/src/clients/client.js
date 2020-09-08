"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.ClientState = void 0;
// A top-level client, which you can subclass to be a Bot, PublicChannel, PrivateMessage client.
/* eslint-disable max-classes-per-file */
var immutable_1 = require("immutable");
var chai_1 = require("chai");
var keys_1 = require("../keys");
var types_1 = require("../types");
var builder_1 = require("../builder");
/**
 * Immutable client state that is passed between stages and
 * updated by advanceNextStage
 */
var ClientState = /** @class */ (function () {
    function ClientState(keyPair, connectionManager, remainingStageCreators, lastUserDatum, builder) {
        this.keyPair = keyPair;
        this.connectionManager = connectionManager;
        this.remainingStageCreators = remainingStageCreators;
        this.lastUserDatum = lastUserDatum;
        this.builder = builder;
    }
    ClientState.prototype.getStage = function () {
        return this.builder.getStage();
    };
    return ClientState;
}());
exports.ClientState = ClientState;
var Client = /** @class */ (function () {
    function Client(connectionManager, initialStageCreators, flushLimit, keyPair) {
        if (flushLimit === void 0) { flushLimit = Client.FLUSH_LIMIT; }
        this.connectionManager = connectionManager;
        this.messageQueue = immutable_1.List();
        this.flushLimit = flushLimit;
        this.preStageListenerMap = immutable_1.Map();
        this.postStageListenerMap = immutable_1.Map();
        this.sentCount = 0;
        this.ackedCount = 0;
        if (initialStageCreators.size === 0) {
            throw new Error('Clients must have at least one initial stage creator to start.');
        }
        // Register this client as the primary 'message' eventHandler for connection
        connectionManager.addDatumListener(this.getConnectionListener());
        var initialKeyPair = keyPair || new keys_1.Secp256k1KeyPair();
        this.builder = new builder_1.ClientStateBuilder(initialKeyPair, connectionManager, initialStageCreators.remove(0), initialStageCreators.first(), { type: 'initial', fromPublicKey: initialKeyPair.getPublicKey().toHexString() }, this);
    }
    Client.prototype.getBuilder = function () {
        return this.builder;
    };
    // Register the current listener
    Client.prototype.addStageListener = function (preStageName, postStageName, listener) {
        var preListeners = this.preStageListenerMap.get(preStageName) || immutable_1.Map();
        this.preStageListenerMap = this.preStageListenerMap.set(preStageName, preListeners.set(preListeners.count(), listener));
        var postListeners = this.postStageListenerMap.get(postStageName) || immutable_1.Map();
        this.postStageListenerMap = this.postStageListenerMap.set(postStageName, postListeners.set(postListeners.count(), listener));
        return new types_1.StageChangeListenerId(preStageName, preListeners.count(), postStageName, postListeners.count());
    };
    Client.prototype.getListenerFromId = function (listenerId) {
        var preListeners = this.preStageListenerMap.get(listenerId.preStageName);
        var postListeners = this.postStageListenerMap.get(listenerId.postStageName);
        var preListener = preListeners === null || preListeners === void 0 ? void 0 : preListeners.get(listenerId.preStageCount);
        var postListener = postListeners === null || postListeners === void 0 ? void 0 : postListeners.get(listenerId.postStageCount);
        if ((preListener === undefined) || (postListener === undefined)) {
            throw new Error("No listener found for ID " + listenerId.toString());
        }
        return preListener;
    };
    Client.prototype.addListenerWrapPromise = function (preStageName, postStageName, listener) {
        var _this = this;
        var listenerId;
        return new Promise(function (resolve, reject) {
            var wrappedListener = function (preStage, postStage, userDatum) {
                try {
                    var result = listener(preStage, postStage, userDatum);
                    // Remove any listener after we have resolved it once
                    _this.removeStageListener(listenerId);
                    console.log('Removed listener ', listenerId.toString());
                    resolve(result);
                }
                catch (e) {
                    reject(e);
                }
            };
            listenerId = _this.addStageListener(preStageName, postStageName, wrappedListener);
        });
    };
    Client.prototype.removeStageListener = function (listenerId) {
        var preListeners = this.preStageListenerMap.get(listenerId.preStageName) || immutable_1.Map();
        this.preStageListenerMap = this.preStageListenerMap.set(listenerId.preStageName, preListeners.set(listenerId.preStageCount, null));
        var postListeners = this.postStageListenerMap.get(listenerId.postStageName) || immutable_1.Map();
        this.postStageListenerMap = this.postStageListenerMap.set(listenerId.postStageName, postListeners.set(listenerId.postStageCount, null));
        chai_1.assert(this.getListenerFromId(listenerId) === null, "Removed listener " + listenerId.toString() + " still exists");
    };
    Client.prototype.getFirstMessage = function () {
        if (!this.messageQueue.isEmpty()) {
            return this.messageQueue.first();
        }
        return { type: 'empty', fromPublicKey: this.builder.getClientState().keyPair.getPublicKey().toHexString() };
    };
    Client.prototype.popFirstMessage = function () {
        this.messageQueue = this.messageQueue.remove(0);
    };
    Client.prototype.isMessageQueueEmpty = function () {
        return this.messageQueue.isEmpty();
    };
    /**
     * Kick off the first stage, and the request-response cycle,
     * after the connection is open.
     */
    Client.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // wait until connection manager is ready
                    return [4 /*yield*/, this.connectionManager.start()];
                    case 1:
                        // wait until connection manager is ready
                        _a.sent();
                        this.builder.startStage();
                        return [2 /*return*/];
                }
            });
        });
    };
    Client.prototype.enqueueUserDatum = function (datum) {
        this.messageQueue = this.messageQueue.push(datum);
        this.sentCount = (this.sentCount + 1);
        //this.triggerQueueProcessing()
    };
    Client.prototype.enqueueMessage = function (msg) {
        this.enqueueUserDatum({
            type: 'msg',
            msg: msg,
            fromPublicKey: this.builder.getClientState().keyPair.getPublicKey().toHexString(),
        });
    };
    Client.prototype.getConnectionListener = function () {
        var _this = this;
        return function (datum) {
            try {
                /*
                if (datum.type === 'success' && datum.msg === 'MESSAGE SENT') {
                  this.ackedCount = (this.ackedCount + 1) as integer
                } else {
                  */
                {
                    var newBuilder = _this.builder.getStage().parseReplyToNextBuilder(datum);
                    var lastUserDatum_1 = newBuilder.getClientState().lastUserDatum;
                    // fire off any listeners
                    var preStage_1 = _this.builder.getStage();
                    var postStage_1 = newBuilder.getStage();
                    var preListeners = _this.preStageListenerMap.get(preStage_1.stageName) || immutable_1.Map();
                    var postListeners_1 = _this.postStageListenerMap.get(postStage_1.stageName) || immutable_1.Map();
                    var listeners = preListeners.filter(
                    /* eslint-disable max-len */
                    function (filter) { return (filter !== null) && postListeners_1.includes(filter); });
                    listeners.forEach(function (listener, index) {
                        if (listener) {
                            console.log('Listeners index', index);
                            listener(preStage_1, postStage_1, lastUserDatum_1);
                        }
                    });
                    _this.builder = newBuilder;
                }
                // Immediately start the new stage
                _this.builder.startStage();
            }
            catch (e) {
                /* eslint-disable-line no-console */
                console.error('Client Message Listener ERROR: ', JSON.stringify(e.toString()));
                console.error(e.stack);
                /* eslint-enable-line no-console */
            }
        };
    };
    Client.FLUSH_LIMIT = 10;
    return Client;
}());
exports.Client = Client;
//# sourceMappingURL=client.js.map