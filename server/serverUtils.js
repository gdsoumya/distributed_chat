/*

CLI-SERVER : Only uses TCP connection thus only cli-clients can connect to this server.
CLI-SERVERS can peer with other CLI-SERVERS, WEB-SERVERS and FULL-SERVERS


*/

// imports
const net = require('net');
const readline = require('readline');
const uuid4 = require('uuid').v4;
const { TextEncoder } = require('text-encoder');
const secp256k1 = require('secp256k1');
//------------------------------------------------------------------------------------------------

const BaseServer = class {
  constructor({ host, serverPeerPort }) {
    // default, change this to public IP address or other interface
    this.host = host || '127.0.0.1';
    // default, change to VPN port number if you are on your laptop
    this.serverPeerPort = serverPeerPort || 30303;
    this.client_list = {};
    this.channel_list = {};
    this.peer_list = {};
    this.msg_list = {};
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getChallenge() {
    return uuid4().replace('-', '').slice(0, 32);
  }

  verifyChallenge(challenge, solution, publicKey) {
    try {
      return secp256k1.ecdsaVerify(
        Uint8Array.from(Buffer.from(solution, 'hex')),
        new TextEncoder().encode(challenge),
        Uint8Array.from(Buffer.from(publicKey, 'hex'))
      );
    }
    catch (err) {
      console.log(err);
      return false;
    }
  }
  // ADD PEER
  addPeer(_host, port) {
    let host = _host.replace('localhost', '127.0.0.1');
    const remoteAddr = host + ':' + port;

    if (remoteAddr === `${this.host}:${this.serverPeerPort}`) {
      return;
    }

    const client = new net.Socket();

    client.connect(port, host, () => {
      console.log(`PEER connecting: ${remoteAddr}`);
      client.write(`connect**@#@${this.serverPeerPort}`);
    });

    client.on('data', (data) => this.handlePeerData(client, remoteAddr, data, 2));

    client.on('close', () => this.handlePeerDisconnect(client, remoteAddr));

    client.on('error', (err) => console.log(`PEER ${remoteAddr} error: ${err.message}`));
  }

  //Read cmd input
  sendCMD() {
    const rl = readline.createInterface(process.stdin, process.stdout);
    rl.prompt();
    rl.on('line', (line) => {
      if (line === 'exit') {
        rl.close();
        process.exit(0);
      }
      const cmd = line.split(' ');
      if (cmd.length === 3 && cmd[0] === 'connect') {
        this.addPeer(cmd[1], cmd[2]);
      }
      else if (cmd.length === 1 && cmd[0] === 'peers') {
        const peers = Object.keys(this.peer_list);
        if (peers.length > 0) {
          console.log(`CONENCTED PEERS (${peers.length}):`);
          peers.forEach((k, i) => console.log(`${i + 1}. ${k}`));
        }
        else {
          console.log('No Peers Connected !');
        }
      }
      rl.prompt();
    }).on('close', function () {
      process.exit(0);
    });
  }

  // Transfers peerlist to new peer
  async sendPeers(sock, remoteAddr) {
    for (let p in this.peer_list) {
      if (p != remoteAddr) {
        sock.write(`peer**@#@${p}`);
        await this.sleep(1000);
      }
    }
  }

  //Gnerates unique message id
  genMIG() {
    const id = uuid4().replace('-', '') + ':' + new Date().getTime();
    return id;
  }

  //broadcast messages to clients and peers
  pushMessage(src, mid, data, chn = '') {
    const jsonData = JSON.parse(data);
    const toPublicKey = jsonData['toPublicKey']
    if (toPublicKey && toPublicKey in this.client_list) {
      this.client_list[toPublicKey].write(data);
    }
    else {
      if (chn && chn in this.channel_list) {
        for (let sock in this.channel_list[chn]) {
          if (src != this.channel_list[chn][sock]) {
            this.channel_list[chn][sock].write(data);
          }
        }
      }
    }
    for (let p in this.peer_list) {
      if (p != src) {
        this.peer_list[p].write(`${chn}**@#@${mid}**@#@${data}`);
      }
    }
  }

  /**
	 * TODO: Document what type is! and all these other params
	 */
  handlePeerData(sock, remoteAddr, _data, type) {
    let data = _data.toString();
    console.log(`FROM PEER: ${remoteAddr} - ${data}`);
    const msg = data.split('**@#@');
    if (remoteAddr in this.peer_list) {
      if (msg.length === 3) {
        if (!(msg[1] in this.msg_list)) {
          this.pushMessage(remoteAddr, msg[1], msg[2], msg[0]);
          this.msg_list[msg[1]] = 1;
        }
      }
      else if (msg.length === 2 && msg[0] === 'peer') {
        if (!(msg[1] in this.peer_list)) {
          const peer = msg[1].split(':');
          this.addPeer(peer[0], peer[1]);
          console.log('hello');
        }
      }
    }
    else if (type === 2 && msg.length === 1 && msg[0] === 'ok') {
      this.peer_list[remoteAddr] = sock;
      console.log(`Connected with : ${remoteAddr}`);
      this.sendPeers(sock, remoteAddr);
    }
    else if (type === 1 && msg.length === 2 && msg[0] === 'connect') {
      remoteAddr = remoteAddr + ':' + msg[1];
      this.peer_list[remoteAddr] = sock;
      sock.write('ok');
      console.log(`Connected with : ${remoteAddr}`);
      this.sendPeers(sock, remoteAddr);
    }
    else {
      console.log(`ERROR MSG : ${data}`);
      sock.write('error');
      sock.destroy();
    }
    return remoteAddr;
  }

  handlePeerDisconnect(sock, remoteAddr) {
    console.log(`PEER Disconnected : ${remoteAddr}`);
    delete this.peer_list[remoteAddr];
    sock.destroy();
  }

  handleClientData(sock, data, client) {
    let ch = '';
    try {
      ch = JSON.parse(data);
      if (!ch['fromPublicKey']) throw 'no fromPublicKey member found';
      client.id = ch['fromPublicKey'];
    }
    catch (e) {
      sock.write(JSON.stringify({ type: 'error', msg: `MALFORMED DATA ${e.toString()}` }));
      return;
    }
    console.log('CH' + JSON.stringify(ch))
    if (!(client.id in this.client_list)) {
      if (ch.type == 'connect') {
        client.challenge = this.getChallenge();
        sock.write(JSON.stringify({ type: 'verify', msg: client.challenge }));
      }
      else if (
        ch.type == 'verify' &&
				client.challenge &&
				this.verifyChallenge(client.challenge, ch.msg, client.id)
      ) {
        this.client_list[client.id] = sock;
        console.log(`CLIENT ${client.id} | UNAME : ${ch.uname} JOINED`);
        sock.write(JSON.stringify({ type: 'success', msg: 'Connected to Network' }));
      }
      else {
        sock.write(JSON.stringify({ type: 'error', msg: `MALFORMED DATA: bad sig verify. type ${ch.type} challenge ${ch.challenge}` }));
      }
    }
    else if (ch.type == 'join') {
      if (ch.cname in this.channel_list) {
        this.channel_list[ch.cname][client.id] = sock;
      }
      else {
        this.channel_list[ch.cname] = {};
        this.channel_list[ch.cname][client.id] = sock;
      }
      console.log('Client successfully joined ' + ch.cname)
      sock.write(JSON.stringify({ type: 'success', msg: `Connected to channel ${ch.cname}` }));
    }
    else if (ch.type === 'msg') {
      // TODO: Message must be addressed to a private DM or channel, consider returning error message here.
      if (!ch.toPublicKey && !ch.cname) return;
      if (ch.cname && !(ch.cname in this.channel_list && client.id in this.channel_list[ch.cname])) {
        sock.write(JSON.stringify({ type: 'error', msg: 'JOIN CHANNEL FIRST' }));
        return;
      }
      console.log('pushing message', client.id, ch.uname, ch.msg);
      const mid = this.genMIG();
      this.msg_list[mid] = 1;
      this.pushMessage(sock, mid, data, ch.cname);
      sock.write(JSON.stringify({ type: 'success', msg: 'MESSAGE SENT' }));
    }
  }

  handleClientDisconnect(client) {
    console.log(`CLIENT disconnected : ${client.id}`);
    if (client.id in this.client_list) {
      for (let ch in this.channel_list)
        if (client.id in this.channel_list[ch]) {
          delete this.channel_list[ch][client.id];
          break;
        }
      delete this.client_list[client.id];
    }
  }

  //------------------------------------------------------------------------------------------------

  // PEER SERVER

  onPeerConnected(sock) {
    let remoteAddr = sock.remoteAddress;
    console.log(`PEER connecting: ${remoteAddr}`);

    sock.on('data', (data) => {
      remoteAddr = this.handlePeerData(sock, remoteAddr, data, 1); // remoteAddr is updated
    });

    sock.on('close', () => this.handlePeerDisconnect(sock, remoteAddr));

    sock.on('error', (err) => console.log(`PEER ${remoteAddr} error: ${err.message}`));
  }

  onClientConnected(sock, type = 1) {
    //console.log(JSON.stringify(this));

    const client = { id: '', challenge: '' };
    let event = '';

    if (type === 2) {
      sock.write = sock.send;
      event = 'message';
      console.log('CLIENT-WEBSOCK new connection');
    }
    else {
      event = 'data';
      console.log('CLIENT-CLI new connection');
    }

    sock.on(event, (data) => this.handleClientData(sock, data, client));

    sock.on('close', () => this.handleClientDisconnect(client));

    sock.on('error', (err) => console.log(`CLIENT ${client.id} error: ${err.message}`));
  }
};

module.exports = { BaseServer };
