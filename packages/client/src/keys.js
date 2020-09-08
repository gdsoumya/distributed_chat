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
exports.Secp256k1KeyPair = exports.Secp256k1Signature = exports.Secp256k1PublicKey = exports.Secp256k1PrivateKey = exports.HexBuffer = void 0;
/* eslint-disable max-classes-per-file */
var secp256k1_1 = __importDefault(require("secp256k1"));
var chai_1 = require("chai");
var immutable_1 = require("immutable");
var randombytes = require('randombytes');
var TextEncoder = require('text-encoder').TextEncoder;
var HEX_CHARS = /[0-9a-f]/g;
var HexBuffer = /** @class */ (function () {
    function HexBuffer(initialBuffer, requiredBufferLength) {
        chai_1.assert.equal(initialBuffer.length, requiredBufferLength, "Buffer " + initialBuffer + " is of incorrect length.");
        this.bufferValue = initialBuffer;
    }
    HexBuffer.fromString = function (initial, requiredBufferLength) {
        // Find any chars that are not hex chars
        {
            var matches = initial.match(HEX_CHARS);
            if (matches === null) {
                throw new Error("No hex characters found in " + initial);
            }
            var matchList = immutable_1.List(matches);
            var initialChars = immutable_1.List(initial);
            var zipped = initialChars.zipAll(matchList);
            /* eslint-disable max-len */
            var zipFunc = function (_a, index) {
                var x = _a[0], y = _a[1];
                return (((x === undefined) || (y === undefined)) ? -1 : index);
            };
            /* eslint-enable max-len */
            var mismatches = zipped.map(zipFunc);
            var firstMismatch = mismatches.find(function (index) { return (index === -1); });
            chai_1.assert(firstMismatch === undefined, "Not all chars are hex, first mistmatch at " + firstMismatch);
        }
        // Use constructor to check buffer length
        return new HexBuffer(Buffer.from(initial, 'hex'), requiredBufferLength);
    };
    HexBuffer.prototype.toHexString = function () {
        return this.bufferValue.toString('hex');
    };
    HexBuffer.prototype.toUint8Array = function () {
        return Uint8Array.from(this.bufferValue);
    };
    return HexBuffer;
}());
exports.HexBuffer = HexBuffer;
var Secp256k1PrivateKey = /** @class */ (function (_super) {
    __extends(Secp256k1PrivateKey, _super);
    function Secp256k1PrivateKey(privateKey) {
        return _super.call(this, privateKey, Secp256k1PrivateKey.BUFFER_LENGTH) || this;
    }
    Secp256k1PrivateKey.fromString = function (privateKey) {
        var hexBuffer = HexBuffer.fromString(privateKey, Secp256k1PrivateKey.BUFFER_LENGTH);
        return new Secp256k1PrivateKey(hexBuffer.bufferValue);
    };
    Secp256k1PrivateKey.prototype.asUint8Array = function () {
        return Uint8Array.from(this.bufferValue);
    };
    Secp256k1PrivateKey.BUFFER_LENGTH = 32;
    return Secp256k1PrivateKey;
}(HexBuffer));
exports.Secp256k1PrivateKey = Secp256k1PrivateKey;
var Secp256k1PublicKey = /** @class */ (function (_super) {
    __extends(Secp256k1PublicKey, _super);
    function Secp256k1PublicKey(publicKey) {
        var _this = _super.call(this, publicKey, Secp256k1PublicKey.BUFFER_LENGTH) || this;
        chai_1.assert(secp256k1_1.default.publicKeyVerify(Uint8Array.from(publicKey)), "Invalid secp256k1 public key " + publicKey.toString('hex'));
        return _this;
    }
    Secp256k1PublicKey.fromString = function (publicKey) {
        /* eslint-disable no-use-before-define */
        var hexBuffer = HexBuffer.fromString(publicKey, Secp256k1PublicKey.BUFFER_LENGTH);
        return new Secp256k1PublicKey(hexBuffer.bufferValue);
        /* eslint-enable no-use-before-define */
    };
    Secp256k1PublicKey.fromPrivateKey = function (privateKey) {
        /* eslint-disable no-use-before-define */
        var publicKey = secp256k1_1.default.publicKeyCreate(privateKey.asUint8Array());
        return new Secp256k1PublicKey(Buffer.from(publicKey));
        /* eslint-enable no-use-before-define */
    };
    Secp256k1PublicKey.prototype.asUint8Array = function () {
        return Uint8Array.from(this.bufferValue);
    };
    Secp256k1PublicKey.BUFFER_LENGTH = 33;
    return Secp256k1PublicKey;
}(HexBuffer));
exports.Secp256k1PublicKey = Secp256k1PublicKey;
var Secp256k1Signature = /** @class */ (function (_super) {
    __extends(Secp256k1Signature, _super);
    function Secp256k1Signature(signature) {
        return _super.call(this, signature, Secp256k1Signature.BUFFER_LENGTH) || this;
    }
    Secp256k1Signature.fromString = function (signature) {
        var hexBuffer = HexBuffer.fromString(signature, Secp256k1Signature.BUFFER_LENGTH);
        return new Secp256k1Signature(hexBuffer.bufferValue);
    };
    Secp256k1Signature.fromUint8Array = function (sig) {
        return new Secp256k1Signature(Buffer.from(sig));
    };
    Secp256k1Signature.prototype.toHexString = function () {
        return this.bufferValue.toString('hex');
    };
    Secp256k1Signature.BUFFER_LENGTH = 64;
    return Secp256k1Signature;
}(HexBuffer));
exports.Secp256k1Signature = Secp256k1Signature;
var Secp256k1KeyPair = /** @class */ (function () {
    function Secp256k1KeyPair(existingPrivateKey) {
        if (existingPrivateKey === void 0) { existingPrivateKey = null; }
        var privKeyBuffer = existingPrivateKey ? existingPrivateKey.bufferValue : randombytes(32);
        while (true && (privKeyBuffer === null)) { // eslint-disable-line no-constant-condition
            privKeyBuffer = randombytes(32);
            if (secp256k1_1.default.privateKeyVerify(privKeyBuffer)) {
                break;
            }
        }
        this.privateKey = new Secp256k1PrivateKey(privKeyBuffer);
        this.publicKey = Secp256k1PublicKey.fromPrivateKey(this.privateKey);
    }
    Secp256k1KeyPair.prototype.sign = function (message) {
        var encodedMessage = new TextEncoder().encode(message);
        var sigObj = secp256k1_1.default.ecdsaSign(encodedMessage, this.privateKey.asUint8Array());
        // sigObj is an object of type
        // { signature: Uint8Array, recid: integer }
        return Secp256k1Signature.fromUint8Array(sigObj.signature);
    };
    Secp256k1KeyPair.prototype.getSharedKey = function (otherPublicKey) {
        var uint8Array = secp256k1_1.default.ecdh(otherPublicKey.asUint8Array(), this.privateKey.asUint8Array());
        return new Secp256k1PrivateKey(Buffer.from(uint8Array));
    };
    Secp256k1KeyPair.prototype.getPublicKey = function () {
        return this.publicKey;
    };
    return Secp256k1KeyPair;
}());
exports.Secp256k1KeyPair = Secp256k1KeyPair;
//# sourceMappingURL=keys.js.map