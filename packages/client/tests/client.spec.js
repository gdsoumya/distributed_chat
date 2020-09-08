"use strict";
// Test suite for instantiating and kicking off websocket clients
// for basic channel joining stages
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
describe('WebSocket clients', function () {
    var wsc1 = new __1.WebSocketConnectionManager({
        host: 'localhost',
        port: 8546,
        useWSS: false,
    });
    var wsc2 = new __1.WebSocketConnectionManager({
        host: 'localhost',
        port: 8546,
        useWSS: false,
    });
    var client = new __1.PublicChannelClient('wizards', 'iceking', wsc1);
    var client2 = new __1.PublicChannelClient('wizards', 'abracadaniel', wsc2);
    it('has three remaining stages', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            chai_1.assert.equal(client.getBuilder().getClientState().remainingStageCreators.count(), 2, 'Expected 2 remaining stage creators for public channel client.');
            return [2 /*return*/];
        });
    }); });
    it('joins a public channel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var expectedMessages, listenerFunc, prom1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expectedMessages = [
                        'hello2',
                        'MESSAGE SENT',
                        'Connected to channel wizards',
                    ];
                    listenerFunc = function (preStage, postStage, userDatum) {
                        chai_1.assert.equal(userDatum.msg, expectedMessages.pop());
                    };
                    prom1 = new Promise(function (resolve, reject) {
                        var wrappedListenerFunc = function (preStage, postStage, userDatum) {
                            try {
                                listenerFunc(preStage, postStage, userDatum);
                                resolve(true);
                            }
                            catch (e) {
                                reject(e);
                            }
                        };
                        client.addStageListener('publicMessage', 'publicMessage', wrappedListenerFunc);
                    });
                    return [4 /*yield*/, client.enqueueMessage('hello1')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, client2.enqueueMessage('hello2')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, client.start()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, client2.start()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prom1
                        // client.removeStageListener(listenerId)
                    ];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=client.spec.js.map