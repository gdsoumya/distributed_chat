import { JSONObject } from "./types";

const readline = require('readline');
const secp256k1 = require('secp256k1');
const aesjs = require('aes-js');
const { randomBytes } = require('crypto');
const { TextEncoder } = require('text-encoder');
const { assert } = require('chai');

const client = {};

export const MessageConsoleLogger = (_data: string) => {
  //const data = JSON.parse(_data.toString ? _data.toString() : _data);
  const data = JSON.parse(_data);
  // console.log('TYPE ' + data['type']);
  const msg = data['msg']['type'] === 'Buffer' ? Buffer.from(data['msg']).toString() : JSON.stringify(data['msg']);

  //console.log(_data);
  if (data.type === 'msg') {
    if (data['private']) console.log(`${data['uname']}:${data['pk']}:- ${msg}`);
    else console.log(`${data['uname']}:${data['cname']}- ${msg}`);
  }
  else if (data.type === 'error') {
    console.log(`ERROR : ${msg}`);
  }
  else if (data.type === 'success') {
    console.log(`${msg}`);
  }
  else if (data.type === 'verify') {
    console.log(`VERIFY : ${msg}`);
  }
};

// Hashing x and y coordinate of ECC point together, for ECDH
export const hashfn = (x: Uint8Array, y: Uint8Array) => {
  assert.equal(x.length, 32, `Length of Uin8Array x ${x.toString()} is ${x.length} and not 32.`)
  assert.equal(y.length, 32, `Length of Uin8Array y ${y.toString()} is ${y.length} and not 32.`)
  const pubKey = new Uint8Array(33)
  pubKey[0] = (y[31] & 1) === 0 ? 0x02 : 0x03
  pubKey.set(x, 1)
  return pubKey
}

// AES CTR encrypt an arbitrary JSON object, using the given (derived) key
export const encryptJSON = (jsonObj: JSONObject, key: Buffer) => {
  const text = JSON.stringify(jsonObj)
  const textBytes = aesjs.utils.utf8.toBytes(text)
  assert.equal(key.length, 32, 'AES from shared ECDH key is wrong length')
  const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5))
  const encryptedBytes = aesCtr.encrypt(textBytes)
  const encryptedHexString = aesjs.utils.hex.fromBytes(encryptedBytes)
  return encryptedHexString
}

export const decryptHexString = (encryptedHexString: string, key: Buffer) => {
  const encryptedBytes = aesjs.utils.hex.toBytes(encryptedHexString);
 
  // The counter mode of operation maintains internal state, so to
  // decrypt a new instance must be instantiated.
  const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
  const decryptedBytes = aesCtr.decrypt(encryptedBytes);
 
  // Convert our bytes back into text
  const decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
  return decryptedText
}