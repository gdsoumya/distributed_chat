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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var __1 = require("..");
var pubClient_1 = __importDefault(require("../src/clients/pubClient"));
var wsConnMan_1 = __importDefault(require("../src/connmans/wsConnMan"));
describe('Darkchat types', function () {
    it('detects valid secp256k1 keypairs', function () { return __awaiter(void 0, void 0, void 0, function () {
        var pubKey, keyPair;
        return __generator(this, function (_a) {
            pubKey = __1.Secp256k1PublicKey.fromString('025c3d90e6da3324d9b2460ba7aab41bba7f76b0da2b2f2fa4a3b512ff48e598a4');
            keyPair = __1.Secp256k1PrivateKey.fromString('b492d96f7ba566b3a8fd29d9cf8995057baf876c9171d42ee9a11eb3a2b205f4');
            chai_1.assert(pubKey !== null);
            chai_1.assert(keyPair !== null);
            return [2 /*return*/];
        });
    }); });
    it('have correct stage names', function () { return __awaiter(void 0, void 0, void 0, function () {
        var client, publicMessageStage;
        return __generator(this, function (_a) {
            chai_1.assert.equal(__1.PublicMessageStage.name, 'PublicMessageStage', 'PublicMessageStage has correct class name');
            client = new pubClient_1.default('cname', 'uname', new wsConnMan_1.default({ host: 'localhost', port: 8546 }));
            publicMessageStage = new __1.PublicMessageStage('channel', 'username', client.getBuilder());
            chai_1.assert.equal(publicMessageStage.stageName, 'publicMessage', 'PublicMessageStage has correct instance name');
            return [2 /*return*/];
        });
    }); });
});
//# sourceMappingURL=types.spec.js.map