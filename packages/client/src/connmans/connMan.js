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
exports.ConnectionManager = exports.messageConsoleLogger = void 0;
var immutable_1 = require("immutable");
exports.messageConsoleLogger = function (datum) {
    var msg = Buffer.isBuffer(datum.msg)
        ? Buffer.from(datum.msg).toString() : JSON.stringify(datum.msg);
    // console.log(_datum);
    if (datum.type === 'msg') {
        if (datum.private)
            console.log(datum.uname + ":" + datum.pk + ":- " + msg); // eslint-disable-line no-console
        else
            console.log(datum.uname + ":" + datum.cname + "- " + msg); // eslint-disable-line no-console
    }
    else if (datum.type === 'error') {
        console.log("Server ERROR : " + msg); // eslint-disable-line no-console
    }
    else if (datum.type === 'success') {
        console.log("" + msg); // eslint-disable-line no-console
    }
    else if (datum.type === 'verify') {
        console.log("VERIFY : " + msg); // eslint-disable-line no-console
    }
};
var ConnectionManager = /** @class */ (function () {
    function ConnectionManager(connectionCreator, host, port) {
        this.connection = connectionCreator;
        this.host = host;
        this.port = port;
        this.datumListeners = immutable_1.List();
        this.started = false;
    }
    /**
       * Add a message listener callback function of the form
       * (jsonData) => { ... }
       * The ws library, and the isomorphic shim above for Browser Websocket,
       * listen on the event called `message`
       */
    ConnectionManager.prototype.addDatumListener = function (listener) {
        this.datumListeners = this.datumListeners.push(listener);
    };
    ConnectionManager.prototype.sendDatum = function (_a) {
        var type = _a.type, _b = _a.channelName, channelName = _b === void 0 ? null : _b, _c = _a.userName, userName = _c === void 0 ? null : _c, _d = _a.fromPublicKey, fromPublicKey = _d === void 0 ? null : _d, _e = _a.msg, msg = _e === void 0 ? null : _e, _f = _a.toPublicKey, toPublicKey = _f === void 0 ? null : _f;
        var jsonString = JSON.stringify({
            type: type,
            msg: msg,
            uname: userName,
            fromPublicKey: fromPublicKey && fromPublicKey.toHexString(),
            toPublicKey: toPublicKey && toPublicKey.toHexString(),
            cname: channelName,
        });
        // console.log('sendDatum', jsonString) // eslint-disable-line no-console
        this.send(jsonString);
    };
    ConnectionManager.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.started) {
                            throw new Error("Connection manager is already open. Don't share this between clients.");
                        }
                        this.started = true;
                        // Lazy evaluation of connection creator, so that we only create it right before
                        // we register onopen listener
                        if (typeof (this.connection) === 'function') {
                            this.connection = this.connection();
                        }
                        return [4 /*yield*/, this.registerCallbacks()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return ConnectionManager;
}());
exports.ConnectionManager = ConnectionManager;
//# sourceMappingURL=connMan.js.map