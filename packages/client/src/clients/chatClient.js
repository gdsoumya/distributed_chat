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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatClient = void 0;
var readline_1 = __importDefault(require("readline"));
var client_1 = require("./client");
var register_1 = require("../stages/register");
var List = require('immutable').List;
exports.ChatClient = /** @class */ (function (_super) {
    __extends(class_1, _super);
    function class_1(connMan) {
        return _super.call(this, connMan, List([register_1.RequestChallengeStageCreator]), List()) || this;
    }
    /**
     * Register readline interactive REPL. (Don't use for tests)
     */
    class_1.prototype.startChat = function () {
        var _this = this;
        this.start();
        var rl = readline_1.default.createInterface(process.stdin, process.stdout);
        rl.prompt();
        rl.on('line', function (line) {
            if (line.toLowerCase() === 'exit')
                rl.close();
            _this.processLine(line);
            rl.prompt();
        }).on('close', function () {
            process.exit(0);
        });
    };
    class_1.prototype.processLine = function (line) {
        var msg = line.split(' ');
        if (msg[0].toLowerCase() === 'private' && msg.length >= 3) {
            this.enqueueUserDatum({
                type: 'msg',
                fromPublicKey: this.builder.getClientState().keyPair.getPublicKey().toHexString(),
                toPublicKey: msg[1],
                msg: msg.slice(2).join(' '),
            });
        }
        else if (msg.length === 3 && msg[0].toLowerCase() === 'join') {
            this.enqueueUserDatum({
                type: 'join',
                channel: msg[1],
                userName: msg[2],
                fromPublicKey: this.builder.getClientState().keyPair.getPublicKey().toHexString(),
            });
            console.log("CHANNEL NAME : " + msg[1] + "  |   USERNAME : " + msg[2]);
        }
        else if (msg.length >= 2) {
            if (msg.length >= 3) {
                this.enqueueUserDatum({
                    type: 'msg',
                    fromPublicKey: this.builder.getClientState().keyPair.getPublicKey().toHexString(),
                    msg: msg.slice(2).join(' '),
                });
            }
        }
    };
    class_1.prototype.triggerQueueProcessing = function () {
        // TODO: Is this the right thing to do, to buffer for interactive chat client
        return this;
    };
    return class_1;
}(client_1.Client));
exports.default = exports.ChatClient;
//# sourceMappingURL=chatClient.js.map