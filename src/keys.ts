/* eslint-disable max-classes-per-file */
import secp256k1 from 'secp256k1';
import { assert } from 'chai';
import { List } from 'immutable';
import { integer } from './types';

const randombytes = require('randombytes');
const { TextEncoder } = require('text-encoder');

const HEX_CHARS = /[0-9a-f]/g;

export class HexBuffer {
  bufferValue: Buffer;

  static fromString(initial: string, requiredBufferLength: integer) {
    // Find any chars that are not hex chars
    {
      const matches = initial.match(HEX_CHARS);
      if (matches === null) {
        throw new Error(`No hex characters found in ${initial}`);
      }

      const matchList = List(matches as Array<string>);
      const initialChars = List(initial);

      const zipped = initialChars.zipAll(matchList);

      /* eslint-disable max-len */
      const zipFunc = ([x, y]: [string, string], index: number) => (((x === undefined) || (y === undefined)) ? -1 : index) as integer;
      /* eslint-enable max-len */
      const mismatches: List<integer> = zipped.map(zipFunc);

      const firstMismatch = mismatches.find((index: number) => (index === -1));
      assert(firstMismatch === undefined,
        `Not all chars are hex, first mistmatch at ${firstMismatch}`);
    }

    // Use constructor to check buffer length
    return new HexBuffer(Buffer.from(initial, 'hex'), requiredBufferLength);
  }

  toHexString() {
    return this.bufferValue.toString('hex');
  }

  toUint8Array() {
    return Uint8Array.from(this.bufferValue);
  }

  constructor(initialBuffer: Buffer, requiredBufferLength: integer) {
    assert.equal(initialBuffer.length, requiredBufferLength, `Buffer ${initialBuffer} is of incorrect length.`);
    this.bufferValue = initialBuffer;
  }
}

export class Secp256k1PrivateKey extends HexBuffer {
  static BUFFER_LENGTH = 32 as integer

  static fromString(privateKey: string) {
    const hexBuffer = HexBuffer.fromString(privateKey, Secp256k1PrivateKey.BUFFER_LENGTH);
    return new Secp256k1PrivateKey(hexBuffer.bufferValue);
  }

  asUint8Array() {
    return Uint8Array.from(this.bufferValue);
  }

  constructor(privateKey: Buffer) {
    super(privateKey, Secp256k1PrivateKey.BUFFER_LENGTH);
  }
}

export class Secp256k1PublicKey extends HexBuffer {
  static BUFFER_LENGTH = 33 as integer

  static fromString(publicKey: string) {
    /* eslint-disable no-use-before-define */
    const hexBuffer = HexBuffer.fromString(publicKey, Secp256k1PublicKey.BUFFER_LENGTH);
    return new Secp256k1PublicKey(hexBuffer.bufferValue);
    /* eslint-enable no-use-before-define */
  }

  static fromPrivateKey(privateKey: Secp256k1PrivateKey) {
    /* eslint-disable no-use-before-define */
    const publicKey = secp256k1.publicKeyCreate(privateKey.asUint8Array());
    return new Secp256k1PublicKey(Buffer.from(publicKey));
    /* eslint-enable no-use-before-define */
  }

  asUint8Array() {
    return Uint8Array.from(this.bufferValue);
  }

  constructor(publicKey: Buffer) {
    super(publicKey, Secp256k1PublicKey.BUFFER_LENGTH);
    assert(secp256k1.publicKeyVerify(Uint8Array.from(publicKey)), `Invalid secp256k1 public key ${publicKey.toString('hex')}`);
  }
}

export class Secp256k1Signature extends HexBuffer {
  static BUFFER_LENGTH = 64 as integer

  static fromString(signature: string) {
    const hexBuffer = HexBuffer.fromString(signature, Secp256k1Signature.BUFFER_LENGTH);
    return new Secp256k1Signature(hexBuffer.bufferValue);
  }

  static fromUint8Array(sig: Uint8Array) {
    return new Secp256k1Signature(Buffer.from(sig));
  }

  toHexString() {
    return this.bufferValue.toString('hex');
  }

  constructor(signature: Buffer) {
    super(signature, Secp256k1Signature.BUFFER_LENGTH);
  }
}

export class Secp256k1KeyPair {
  private publicKey: Secp256k1PublicKey

  private privateKey: Secp256k1PrivateKey

  constructor(existingPrivateKey: Secp256k1PrivateKey | null = null) {
    let privKeyBuffer = existingPrivateKey ? existingPrivateKey.bufferValue : randombytes(32);
    while (true && (privKeyBuffer === null)) { // eslint-disable-line no-constant-condition
      privKeyBuffer = randombytes(32);
      if (secp256k1.privateKeyVerify(privKeyBuffer)) {
        break;
      }
    }
    this.privateKey = new Secp256k1PrivateKey(privKeyBuffer);
    this.publicKey = Secp256k1PublicKey.fromPrivateKey(this.privateKey);
  }

  sign(message: string) {
    const encodedMessage = new TextEncoder().encode(message);
    const sigObj = secp256k1.ecdsaSign(encodedMessage, this.privateKey.asUint8Array());
    // sigObj is an object of type
    // { signature: Uint8Array, recid: integer }
    return Secp256k1Signature.fromUint8Array(sigObj.signature);
  }

  getPublicKey() {
    return this.publicKey;
  }
}
