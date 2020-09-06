import { JSONObject } from './types';

const aesjs = require('aes-js');
const { assert } = require('chai');

/* eslint-disable no-console */
export const MessageConsoleLogger = (_data: string) => {
  const data = JSON.parse(_data);
  const msg = data.msg.type === 'Buffer' ? Buffer.from(data.msg).toString() : JSON.stringify(data.msg);

  if (data.type === 'msg') {
    if (data.private) console.log(`${data.uname}:${data.pk}:- ${msg}`);
    else console.log(`${data.uname}:${data.cname}- ${msg}`);
  } else if (data.type === 'error') {
    console.log(`Server ERROR : ${msg}`);
  } else if (data.type === 'success') {
    console.log(`${msg}`);
  } else if (data.type === 'verify') {
    console.log(`VERIFY : ${msg}`);
  }
};
/* eslint-enable no-console */

// Hashing x and y coordinate of ECC point together, for ECDH
export const hashfn = (x: Uint8Array, y: Uint8Array) => {
  assert.equal(x.length, 32, `Length of Uin8Array x ${x.toString()} is ${x.length} and not 32.`);
  assert.equal(y.length, 32, `Length of Uin8Array y ${y.toString()} is ${y.length} and not 32.`);
  const pubKey = new Uint8Array(33);
  pubKey[0] = (y[31] & 1) === 0 ? 0x02 : 0x03; // eslint-disable-line no-bitwise
  pubKey.set(x, 1);
  return pubKey;
};

// AES CTR encrypt an arbitrary JSON object, using the given (derived) key
export const encryptJSON = (jsonObj: JSONObject, key: Buffer) => {
  const text = JSON.stringify(jsonObj);
  const textBytes = aesjs.utils.utf8.toBytes(text);
  assert.equal(key.length, 32, 'AES from shared ECDH key is wrong length');
  /* eslint-disable new-cap */
  const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
  /* eslint-disable new-cap */
  const encryptedBytes = aesCtr.encrypt(textBytes);
  const encryptedHexString = aesjs.utils.hex.fromBytes(encryptedBytes);
  return encryptedHexString;
};

export const decryptHexString = (encryptedHexString: string, key: Buffer) => {
  const encryptedBytes = aesjs.utils.hex.toBytes(encryptedHexString);

  // The counter mode of operation maintains internal state, so to
  // decrypt a new instance must be instantiated.
  const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
  const decryptedBytes = aesCtr.decrypt(encryptedBytes);

  // Convert our bytes back into text
  const decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
  return decryptedText;
};
