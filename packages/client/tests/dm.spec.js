"use strict";
// Test suite for encrypted direct messages
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
var chai_1 = require("chai");
var __1 = require("..");
var keys_1 = require("../src/keys");
// eslint-disable-next-line no-undef
describe('Encrypted direct messages', function () {
    var wsConnMan1 = new __1.WebSocketConnectionManager({
        host: 'localhost',
        port: 8546,
        useWSS: false,
    });
    var wsConnMan2 = new __1.WebSocketConnectionManager({
        host: 'localhost',
        port: 8546,
        useWSS: false,
    });
    /* eslint-disable no-undef */
    it('exchanges two encrypted DMs between clients', function () { return __awaiter(void 0, void 0, void 0, function () {
        var keyPair1, keyPair2, client1, client2, expected2Message1, expected2Message2, expected2Message3, expected1Message, prom1, expectedMessages, prom2, expected2Messages, listenerFunc2, prom3, prom4, e_1, prom5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    keyPair1 = new keys_1.Secp256k1KeyPair();
                    keyPair2 = new keys_1.Secp256k1KeyPair();
                    client1 = new __1.PrivateChannelClient(keyPair2.getPublicKey(), wsConnMan1, 1, keyPair1);
                    client2 = new __1.PrivateChannelClient(keyPair1.getPublicKey(), wsConnMan2, 1, keyPair2);
                    expected2Message1 = 'private message from 1 to 2';
                    expected2Message2 = 'another private message from 1 to 2';
                    expected2Message3 = 'unsent private message from 1 to 2';
                    expected1Message = 'private message from 2 to 1';
                    prom1 = client1.addListenerWrapPromise('requestChallenge', 'signChallenge', function (preStage, postStage, userDatum) {
                        chai_1.assert.equal(userDatum.type, 'verify', "Verify message not found " + JSON.stringify(userDatum));
                    });
                    expectedMessages = [
                        expected1Message,
                        'Connected to Network',
                        'MESSAGE SENT',
                    ];
                    prom2 = client1.addListenerWrapPromise('privateMessage', 'privateMessage', function (preStage, postStage, userDatum) {
                        var nextMsg = expectedMessages.pop();
                        console.log("Client 1 MSG: " + userDatum.msg + " " + nextMsg + " " + (userDatum.msg === nextMsg));
                        chai_1.assert.equal(userDatum.msg, nextMsg, 'Client 1 privateMessage mismatch');
                    });
                    expected2Messages = [
                        expected2Message3,
                        expected2Message2,
                        'bobo the clown0',
                        expected2Message1,
                    ];
                    listenerFunc2 = function (preStage, postStage, userDatum) {
                        var nextMsg = expected2Messages.pop();
                        console.log("Client 2 MSG: " + userDatum.msg + " " + nextMsg + " " + (userDatum.msg === nextMsg));
                        chai_1.assert(userDatum.msg === nextMsg, userDatum.msg + " !== " + nextMsg);
                        chai_1.assert.equal(userDatum.msg, nextMsg, 'Client 2 privateMessage mismatch');
                    };
                    client1.enqueueMessage(expected2Message1);
                    prom3 = client2.addListenerWrapPromise('privateMessage', 'privateMessage', listenerFunc2);
                    client1.start();
                    client2.start();
                    return [4 /*yield*/, prom1]; // client1 register as DM
                case 1:
                    _a.sent(); // client1 register as DM
                    return [4 /*yield*/, prom2]; // client1 MESSAGE SENT
                case 2:
                    _a.sent(); // client1 MESSAGE SENT
                    console.log('PROM 2');
                    return [4 /*yield*/, prom3]; // client2 expected2Message1
                case 3:
                    _a.sent(); // client2 expected2Message1
                    console.log('PROM 3');
                    prom4 = client2.addListenerWrapPromise('privateMessage', 'privateMessage', listenerFunc2);
                    client1.enqueueMessage(expected2Message2);
                    client1.getBuilder().startStage();
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, prom4]; // client2 bobo the clown0 false
                case 5:
                    _a.sent(); // client2 bobo the clown0 false
                    return [3 /*break*/, 7];
                case 6:
                    e_1 = _a.sent();
                    return [3 /*break*/, 7];
                case 7:
                    prom5 = client2.addListenerWrapPromise('privateMessage', 'privateMessage', listenerFunc2);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=dm.spec.js.map