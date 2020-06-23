const readline = require('readline');
const secp256k1 = require('secp256k1');
const { randomBytes } = require('crypto');
const { TextEncoder } = require('text-encoder');

const client = {};

client.messageConsoleLogger = (_data) => {
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

	addMessageListener(listener) {
		throw new Error('Define this method in your subclass of BaseClient');
	}

	genKeyPair() {
		while (true) {
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

	sendMessage(type, msg = '', dm = '') {
		return this.connection.write(
			JSON.stringify({
				type: type,
				msg: msg,
				uname: this.uname,
				pk: this.publicKey,
				private: dm,
				cname: this.channel,
			})
		);
	}

	on(eventName, cb) {
		return this.connection.on(eventName, cb);
	}

	processLine(line) {
		if (line.toLowerCase() === 'exit') rl.close();
		const msg = line.split(' ');
		if (msg[0].toLowerCase() === 'connect') this.sendMessage('connect');
		else if (msg[0].toLowerCase() === 'sign' && msg.length == 2) console.log(this.genSignature(msg[1]));
		else if (msg[0].toLowerCase() === 'verify' && msg.length == 2)
			this.sendMessage('verify', this.genSignature(msg[1]));
		else if (msg[0].toLowerCase() === 'private' && msg.length >= 3)
			this.sendMessage('msg', msg.slice(2).join(' '), msg[1]);
		else if (msg.length === 3 && msg[0].toLowerCase() === 'join') {
			this.channel = msg[1];
			this.uname = msg[2];
			this.sendMessage('join', '');
			console.log(`CHANNEL NAME : ${this.channel}  |   USERNAME : ${this.uname}`);
		} else if (msg.length >= 2) {
			this.channel = msg[0];
			this.sendMessage('msg', msg.slice(1).join(' '));
		}
	}

	/**
	 * Open the connection and start responding to event listeners.
	 */
  start() {
    throw new Error('Override start() method in subclass to open and setup your connection.');
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
    console.log('Generating Key Pair....');
    this.genKeyPair();
    console.log('Your PUBLIC KEY : ', this.publicKey);
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
