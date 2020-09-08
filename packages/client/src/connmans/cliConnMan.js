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
exports.CommandLineConnectionManager = void 0;
var connMan_1 = require("./connMan");
var net = require('net');
/**
 * How to instantiate a CommandLineClient
 *
 * // Instantiate a new object (not started yet)
 * const c = new CommandLineClient({ host, port })
 *
 * // Register any event handlers, especially the 'connect' event
 * c.on('event', () => {
 *   ...
 * }
 *
 * // Register a message listener, which abstracts away the `data` event
 * c.addMessageListener((data) => {
 *   ...
 * }
 *
 * // Start the client, which opens the connections
 * c.start()
 *
 */
var CommandLineConnectionManager = /** @class */ (function (_super) {
    __extends(CommandLineConnectionManager, _super);
    function CommandLineConnectionManager(host, port) {
        var _this = _super.call(this, function () { return new net.Socket(); }, host, port) || this;
        _this.tcpSocket = _this.connection;
        return _this;
    }
    CommandLineConnectionManager.prototype.send = function (jsonString) {
        this.tcpSocket.write(jsonString);
        // Add a 'close' event handler for the client socket
        this.tcpSocket.on('close', function () {
            console.log('Client closed'); // eslint-disable-line no-console
            process.exit();
        });
        this.tcpSocket.on('error', function (err) {
            console.error(err); // eslint-disable-line no-console
            process.exit();
        });
    };
    // CLI net clients can connect to a server separately after creating a connection.
    CommandLineConnectionManager.prototype.registerCallbacks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                // Add CLI TCP socket specific client logger and connection logic
                this.tcpSocket.connect(this.port, this.host, function () {
                    console.log("Client connected to: " + _this.host + ":" + _this.port);
                });
                return [2 /*return*/];
            });
        });
    };
    CommandLineConnectionManager.prototype.stop = function () {
        // TODO: Find a way to expect an empty stop() method without using this
        return this.tcpSocket;
    };
    /**
     * Add a message listener callback function of the form
     * (jsonData) => { ... }
     * The net library listens on the event called `data`
     */
    CommandLineConnectionManager.prototype.addMessageListener = function (listener) {
        this.tcpSocket.on('data', listener);
    };
    return CommandLineConnectionManager;
}(connMan_1.ConnectionManager));
exports.CommandLineConnectionManager = CommandLineConnectionManager;
exports.default = CommandLineConnectionManager;
//# sourceMappingURL=cliConnMan.js.map