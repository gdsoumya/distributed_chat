const readline = require('readline');
const secp256k1 = require('secp256k1');
const aesjs = require('aes-js');
const { randomBytes } = require('crypto');
const { TextEncoder } = require('text-encoder');
const { assert } = require('chai');

const client = {};

client.messageConsoleLogger = (_data, wsc) => {
  //const data = JSON.parse(_data.toString ? _data.toString() : _data);
  const data = JSON.parse(_data);
  // console.log('TYPE ' + data['type']);
  let msg = data['msg']['type'] === 'Buffer' ? Buffer.from(data['msg']).toString() : JSON.stringify(data['msg']);

  //console.log(_data);
  if (data.type === 'msg') {
    if (data['toPublicKey']){
      msg = data['msg']
      const sharedKey = Buffer.from(wsc.getSharedKeyAsBuffer(data['fromPublicKey']).slice(1))
      const decrypted_msg = client.decryptHexString({encryptedHexString:msg, key:sharedKey})
      console.log(`${data['uname']}:${data['fromPublicKey']}:- ${decrypted_msg}`);
    }
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
const hashfn = (x, y) => {
  const pubKey = new Uint8Array(33)
  pubKey[0] = (y[31] & 1) === 0 ? 0x02 : 0x03
  pubKey.set(x, 1)
  return pubKey
}

// AES CTR encrypt an arbitrary JSON object, using the given (derived) key
client.encryptJSON = ({ jsonObj, key }) => {
  const text = JSON.stringify(jsonObj)
  const textBytes = aesjs.utils.utf8.toBytes(text)
  assert.equal(key.length, 32, 'AES from shared ECDH key is wrong length')
  const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5))
  const encryptedBytes = aesCtr.encrypt(textBytes)
  const encryptedHexString = aesjs.utils.hex.fromBytes(encryptedBytes)
  return encryptedHexString
}

client.decryptHexString = ({ encryptedHexString, key }) => {
  const encryptedBytes = aesjs.utils.hex.toBytes(encryptedHexString);
 
  // The counter mode of operation maintains internal state, so to
  // decrypt a new instance must be instantiated.
  const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
  const decryptedBytes = aesCtr.decrypt(encryptedBytes);
 
  // Convert our bytes back into text
  const decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
  return decryptedText
}

client.BaseClient = class {

  constructor(connection, host, port) {
    this.uname = '';
    this.channel = '';
    this.connection = connection;
    this.host = host;
    this.port = port;
    this.publicKey = '';
    this.privateKey = '';
  }

  setUsername(newUname) {
    this.uname = newUname;
  }

  setChannel(newChannel) {
    this.channel = newChannel;
  }

  addMessageListener(listener) { // eslint-disable-line no-unused-vars
    throw new Error('Define this method in your subclass of BaseClient');
  }

  genKeyPair() {
    while (true) { // eslint-disable-line no-constant-condition
      const privKey = randomBytes(32);
      if (secp256k1.privateKeyVerify(privKey)) {
        this.privateKey = privKey;
        break;
      }
    }
    this.publicKey = Buffer.from(secp256k1.publicKeyCreate(this.privateKey)).toString('hex');
  }

  genSignature(msg) {
    msg = new TextEncoder().encode(msg);
    const sigObj = secp256k1.ecdsaSign(msg, this.privateKey);
    return Buffer.from(sigObj.signature).toString('hex');
  }

  getSharedKeyAsBuffer(otherPublicKeyString) {
    // This is the compressed x coordinate of the resulting ecdh point
    // https://www.npmjs.com/package/secp256k1
    const otherPubKey = Uint8Array.from(Buffer.from(otherPublicKeyString, 'hex'))
    return secp256k1.ecdh(otherPubKey, this.privateKey, { hashfn }, Buffer.alloc(33))
  }

  sendMessage(msgObj) {
    return this.connection.write(
      JSON.stringify(msgObj)
    );
  }

  constructAndSendMessage(type, msg = '', toPublicKey = '') {
    const msgObj = this.constructMessage(type, msg, toPublicKey)
    return this.sendMessage(msgObj)
  }

  constructMessage(type, msg = '', toPublicKey = '') {

    let msgString = msg
    let messageObj = {
      type: type,
      msg: msgString,
      uname: this.uname,
      fromPublicKey: this.publicKey,
      toPublicKey,
      cname: this.channel,
    }
    if (toPublicKey !== '') {
      const toPubKeyBuffer = Uint8Array.from(Buffer.from(toPublicKey, 'hex'))
      assert(secp256k1.publicKeyVerify(toPubKeyBuffer))
      const sharedKey = Buffer.from(this.getSharedKeyAsBuffer(toPublicKey), 'hex')
      // By convention, the first byte denotes whether coordinate is compressed or not
      // We slice it off and just use the last 32 bytes
      msgString = client.encryptJSON({ jsonObj: messageObj, key: sharedKey.slice(1) })
      messageObj.msg = msgString
    }

    return messageObj;
  }

  on(eventName, cb) {
    return this.connection.on(eventName, cb);
  }

  processLine(line) {
    const msg = line.split(' ');
    if (msg[0].toLowerCase() === 'connect') this.constructAndSendMessage('connect');
    else if (msg[0].toLowerCase() === 'sign' && msg.length == 2) console.log(this.genSignature(msg[1]));
    else if (msg[0].toLowerCase() === 'verify' && msg.length == 2) this.constructAndSendMessage('verify',msg[1]);
    else if (msg[0].toLowerCase() === 'private' && msg.length >= 3)
      this.constructAndSendMessage('msg', msg.slice(2).join(' '), msg[1]);
    else if (msg.length === 3 && msg[0].toLowerCase() === 'join') {
      this.channel = msg[1];
      this.uname = msg[2];
      this.constructAndSendMessage('join', '');
      console.log(`CHANNEL NAME : ${this.channel}  |   USERNAME : ${this.uname}`);
    }
    else if (msg.length >= 2) {
      this.channel = msg[0];
      this.constructAndSendMessage('msg', msg.slice(1).join(' '));
    }
  }

  /**
	 * Open the connection and start responding to event listeners.
   * Non-interactive, runnable in both tests and called by startChat.
	 */
  init() {
    console.log('Generating Key Pair....');
    this.genKeyPair();
    console.log('Your PUBLIC KEY : ', this.publicKey);
  }

  /**
	 * Close the connection, to allow the client to end non-interactively.
	 */
  stop() {
    this.connection.close();
  }

  /**
	 * Register readline interactive REPL. (Don't use for tests)
	 */
  startChat() {
    this.init()
    const rl = readline.createInterface(process.stdin, process.stdout);
    rl.prompt();
    rl.on('line', (line) => {
      if (line.toLowerCase() === 'exit') rl.close();
      this.processLine(line);
      rl.prompt();
    }).on('close', function () {
      process.exit(0);
    });
  }
};

module.exports = client;
