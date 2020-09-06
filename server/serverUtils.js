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

  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static getChallenge() {
    return uuid4().replace('-', '').slice(0, 32);
  }

  static verifyChallenge(challenge, solution, publicKey) {
    try {
      return secp256k1.ecdsaVerify(
        Uint8Array.from(Buffer.from(solution, 'hex')),
        new TextEncoder().encode(challenge),
        Uint8Array.from(Buffer.from(publicKey, 'hex')),
      );
    } catch (err) {
      console.log(err); // eslint-disable-line no-console
      return false;
    }
  }

  // ADD PEER
  addPeer(_host, port) {
    const host = _host.replace('localhost', '127.0.0.1');
    const remoteAddr = `${host}:${port}`;

    if (remoteAddr === `${this.host}:${this.serverPeerPort}`) {
      return;
    }

    const client = new net.Socket();

    client.connect(port, host, () => {
      console.log(`PEER connecting: ${remoteAddr}`); // eslint-disable-line no-console
      client.write(`connect**@#@${this.serverPeerPort}`);
    });

    client.on('data', (data) => this.handlePeerData(client, remoteAddr, data, 2));

    client.on('close', () => this.handlePeerDisconnect(client, remoteAddr));

    /* eslint-disable no-console */
    client.on('error', (err) => console.log(`PEER ${remoteAddr} error: ${err.message}`));
    /* eslint-enable no-console */
  }

  // Read cmd input
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
      } else if (cmd.length === 1 && cmd[0] === 'peers') {
        const peers = Object.entries(this.peer_list);
        if (peers.length > 0) {
          console.log(`CONNECTED PEERS (${peers.length}):`); // eslint-disable-line no-console
          peers.forEach((k, v) => console.log(`${v + 1}. ${k}`)) // eslint-disable-line no-console
        } else {
          console.log('No Peers Connected !'); // eslint-disable-line no-console
        }
      }
      rl.prompt();
    }).on('close', () => {
      process.exit(0);
    });
  }

  // Transfers peerlist to new peer
  async sendPeers(sock, remoteAddr) {
    await Promise.all(this.peer_list.map(async (peer) => {
      if (peer !== remoteAddr) {
        await sock.write(`peer**@#@${peer}`);
      }
    }));
  }

  // Gnerates unique message id
  static genMIG() {
    const id = `${uuid4().replace('-', '')}:${new Date().getTime()}`;
    return id;
  }

  // broadcast messages to clients and peers
  pushMessage(src, mid, data, chn = '') {
    const jsonData = JSON.parse(data);
    const { toPublicKey } = jsonData;
    if (toPublicKey && toPublicKey in this.client_list) {
      this.client_list[toPublicKey].write(data);
    } else if (chn && chn in this.channel_list) {
      const channels = Object.entries(this.channel_list[chn])
      channels.forEach((key, sock) => {
        if (src !== sock) {
          sock.write(data);
        }
      });
    }
    this.peer_list.forEach((peer) => {
      if (peer !== src) {
        this.peer_list[peer].write(`${chn}**@#@${mid}**@#@${data}`);
      }
    });
  }

  /**
   * TODO: Document what type is! and all these other params
   */
  handlePeerData(sock, remoteAddr, _data, type) {
    const data = _data.toString();
    console.log(`FROM PEER: ${remoteAddr} - ${data}`); // eslint-disable-line no-console
    const msg = data.split('**@#@');
    if (remoteAddr in this.peer_list) {
      if (msg.length === 3) {
        if (!(msg[1] in this.msg_list)) {
          this.pushMessage(remoteAddr, msg[1], msg[2], msg[0]);
          this.msg_list[msg[1]] = 1;
        }
      } else if (msg.length === 2 && msg[0] === 'peer') {
        if (!(msg[1] in this.peer_list)) {
          const peer = msg[1].split(':');
          this.addPeer(peer[0], peer[1]);
          console.log('hello'); // eslint-disable-line no-console
        }
      }
    } else if (type === 2 && msg.length === 1 && msg[0] === 'ok') {
      this.peer_list[remoteAddr] = sock;
      console.log(`Connected with : ${remoteAddr}`); // eslint-disable-line no-console
      this.sendPeers(sock, remoteAddr);
    } else if (type === 1 && msg.length === 2 && msg[0] === 'connect') {
      const newRemoteAddr = `${remoteAddr}:${msg[1]}`;
      this.peer_list[remoteAddr] = sock;
      sock.write('ok');
      console.log(`Connected with : ${newRemoteAddr}`); // eslint-disable-line no-console
      this.sendPeers(sock, remoteAddr);
    } else {
      console.log(`ERROR MSG : ${data}`); // eslint-disable-line no-console
      sock.write('error');
      sock.destroy();
    }
    return remoteAddr;
  }

  handlePeerDisconnect(sock, remoteAddr) {
    console.log(`PEER Disconnected : ${remoteAddr}`); // eslint-disable-line no-console
    delete this.peer_list[remoteAddr];
    sock.destroy();
  }

  handleClientData(sock, data, client) {
    let ch = '';
    try {
      ch = JSON.parse(data);
      if (!ch.fromPublicKey) throw new Error('no fromPublicKey member found');
      client.id = ch.fromPublicKey; // eslint-disable-line no-param-reassign
    } catch (e) {
      sock.write(JSON.stringify({ type: 'error', msg: `MALFORMED DATA ${e.toString()}` }));
      return;
    }
    console.log(`CH${JSON.stringify(ch)}`); // eslint-disable-line no-console
    if (!(client.id in this.client_list)) {
      if (ch.type === 'connect') {
        client.challenge = BaseServer.getChallenge(); // eslint-disable-line no-param-reassign
        sock.write(JSON.stringify({ type: 'verify', msg: client.challenge }));
      } else if (ch.type === 'verify' && client.challenge
        && BaseServer.verifyChallenge(client.challenge, ch.msg, client.id)
      ) {
        this.client_list[client.id] = sock;
        /* eslint-disable no-console */
        console.log(`CLIENT ${client.id} | UNAME : ${ch.uname} JOINED`);
        /* eslint-enable no-console */
        sock.write(JSON.stringify({ type: 'success', msg: 'Connected to Network' }));
      } else {
        sock.write(JSON.stringify({ type: 'error', msg: `MALFORMED DATA: bad sig verify. type ${ch.type} challenge ${ch.challenge}` }));
      }
    } else if (ch.type === 'join') {
      if (ch.cname in this.channel_list) {
        this.channel_list[ch.cname][client.id] = sock;
      } else {
        this.channel_list[ch.cname] = {};
        this.channel_list[ch.cname][client.id] = sock;
      }
      console.log(`Client successfully joined ${ch.cname}`); // eslint-disable-line no-console
      sock.write(JSON.stringify({ type: 'success', msg: `Connected to channel ${ch.cname}` }));
    } else if (ch.type === 'msg') {
      if (!ch.toPublicKey && !ch.cname) {
        sock.write(JSON.stringify({
          type: 'error',
          msg: 'toPublicKey (private) or cname (public) destination required.',
        }));
      }
      /* eslint-disable max-len */
      if (ch.cname && !(ch.cname in this.channel_list && client.id in this.channel_list[ch.cname])) {
        /* eslint-enable max-len */
        sock.write(JSON.stringify({ type: 'error', msg: 'JOIN CHANNEL FIRST' }));
        return;
      }
      console.log('pushing message', client.id, ch.uname, ch.msg); // eslint-disable-line no-console
      const mid = this.genMIG();
      this.msg_list[mid] = 1;
      this.pushMessage(sock, mid, data, ch.cname);
      sock.write(JSON.stringify({ type: 'success', msg: 'MESSAGE SENT' }));
    }
  }

  handleClientDisconnect(client) {
    console.log(`CLIENT disconnected : ${client.id}`); // eslint-disable-line no-console
    if (client.id in this.client_list) {
      const channels = Object.entries(this.channel_list)
      channels.forEach(([ch, channel]) => {
        if (client.id in channel) {
          delete this.channel_list[ch][client.id];
        }
      });
      delete this.client_list[client.id];
    }
  }

  //------------------------------------------------------------------------------------------------

  // PEER SERVER

  onPeerConnected(sock) {
    let remoteAddr = sock.remoteAddress;
    console.log(`PEER connecting: ${remoteAddr}`); // eslint-disable-line no-console

    sock.on('data', (data) => {
      remoteAddr = this.handlePeerData(sock, remoteAddr, data, 1); // remoteAddr is updated
    });

    sock.on('close', () => this.handlePeerDisconnect(sock, remoteAddr));

    /* eslint-disable no-console */
    sock.on('error', (err) => console.log(`PEER ${remoteAddr} error: ${err.message}`));
    /* eslint-enable no-console */
  }

  onClientConnected(sock, type = 1) {
    // console.log(JSON.stringify(this));

    const client = { id: '', challenge: '' };
    let event = '';

    if (type === 2) {
      sock.write = sock.send; // eslint-disable-line no-param-reassign
      event = 'message';
      console.log('CLIENT-WEBSOCK new connection'); // eslint-disable-line no-console
    } else {
      event = 'data';
      console.log('CLIENT-CLI new connection'); // eslint-disable-line no-console
    }

    sock.on(event, (data) => this.handleClientData(sock, data, client));

    sock.on('close', () => this.handleClientDisconnect(client));

    /* eslint-disable no-console */
    sock.on('error', (err) => console.log(`CLIENT ${client.id} error: ${err.message}`));
    /* eslint-enable no-console */
  }
};

module.exports = { BaseServer };