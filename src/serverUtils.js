/*

CLI-SERVER : Only uses TCP connection thus only cli-clients can connect to this server.
CLI-SERVERS can peer with other CLI-SERVERS, WEB-SERVERS and FULL-SERVERS


*/

// imports
const net = require('net');
const readline = require('readline');
const uuid4 = require('uuid').v4;

//------------------------------------------------------------------------------------------------

const BaseServer = class { 

  constructor({ host, serverPeerPort }) {

    // default, change this to public IP address or other interface
    this.host = host || 'localhost';
    // default, change to VPN port number if you are on your laptop
    this.serverPeerPort = serverPeerPort || 30303;
    this.client_list  = {};
    this.channel_list = {};
    this.peer_list    = {};
    this.msg_list     = {};
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ADD PEER
  addPeer( _host, port ) {

    let host = _host.replace('localhost','127.0.0.1');
    const remoteAddr = host + ':' + port; 

    if (remoteAddr===`${this.host}:${this.serverPeerPort}`) {
      return;
    }

    const client = new net.Socket();
    
    client.connect(port, host, ()=>{
      console.log(`PEER connecting: ${remoteAddr}`);
      client.write(`connect**@#@${this.serverPeerPort}`);
    });
     
    client.on('data', data => this.handlePeerData(client, remoteAddr, data, 2));

    client.on('close', () => this.handlePeerDisconnect(client, remoteAddr));

    client.on('error', err => console.log(`PEER ${remoteAddr} error: ${err.message}`));

  }

  //Read cmd input
  sendCMD() {
    const rl = readline.createInterface(process.stdin, process.stdout);
    rl.prompt();
    rl.on('line', (line) => {
      if (line === 'exit'){
        rl.close();
        process.exit(0);
      }
      const cmd = line.split(' ');
      if (cmd.length===3 && cmd[0]==='connect') {
        this.addPeer(cmd[1], cmd[2]);
      } 
      else if (cmd.length===1 && cmd[0]==='peers'){
        const peers=Object.keys(this.peer_list);
        if (peers.length > 0) {
          console.log(`CONENCTED PEERS (${peers.length}):`);
          peers.forEach((k,i) => console.log(`${i+1}. ${k}`))
        }
        else {
          console.log('No Peers Connected !');
        }
      }
      rl.prompt();
    }).on('close',function(){
      process.exit(0);
    });
  }

  // Transfers peerlist to new peer
  async sendPeers(sock, remoteAddr) {
    for (let p in this.peer_list) {
      if (p!=remoteAddr) {
        sock.write(`peer**@#@${p}`);
        await this.sleep(1000);
      }
    }
  }

  //Gnerates unique message id
  genMIG() {
    const id = uuid4().replace('-','')+':'+new Date().getTime();
    return id;
  }

  //broadcast messages to clients and peers
  pushMessage(src, cid, mid, data, chn='') {
    const ch = cid==='' ? chn : this.client_list[cid];
    if (ch in this.channel_list) {
      for (let sock of this.channel_list[ch]) {
        if (src != sock) {
          sock.write(data);
        }
      }
    }
    for (let p in this.peer_list) {
      if (p != src) {
        this.peer_list[p].write(`${ch}**@#@${mid}**@#@${data}`);
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
      if ( msg.length===3) {
        if (!(msg[1] in this.msg_list)) {
          this.pushMessage(remoteAddr, '', msg[1], msg[2], msg[0]);
          this.msg_list[msg[1]] = 1;
        }
      }
      else if ((msg.length === 2) && (msg[0] === 'peer')) {
        if (!(msg[1] in this.peer_list)) {
          const peer = msg[1].split(':');
          this.addPeer(peer[0], peer[1]);
          console.log('hello')
        }
      }
    } 
    else if ((type === 2) && (msg.length === 1) && (msg[0] === 'ok')) {
      this.peer_list[remoteAddr] = sock;
      console.log(`Connected with : ${remoteAddr}`);
      this.sendPeers(sock, remoteAddr);
    } 
    else if ((type === 1) && (msg.length === 2) && (msg[0] === 'connect')) {
      remoteAddr = remoteAddr+':'+msg[1];
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

  handleClientData(sock, data, id) {
    let ch=''
    try {
      ch = JSON.parse(data);
    }
    catch(e) {
      sock.write(JSON.stringify({type:'error', msg:'MALFORMED DATA'}));
      return;
    }
    if (!(id in this.client_list)) {
      if (ch.type!='join') {
        sock.write(JSON.stringify({type:'error', msg:'MALFORMED DATA'}));
      }
      else {
        this.client_list[id]=ch.cname;
        if (ch.cname in this.channel_list) {
          this.channel_list[ch.cname].push(sock);
        }
        else {
          this.channel_list[ch.cname]=[sock];
        }
        console.log(`CLIENT ${id} | UNAME : ${ch.uname} JOINED`);
        sock.write(JSON.stringify({type:'success', msg:`Connected to channel ${ch.cname}`}));
      }
    }
    else if (ch.type==='msg') {
      console.log('pushing message',id,ch.uname, ch.msg);
      const mid = this.genMIG();
      this.msg_list[mid]=1;
      this.pushMessage(sock, id, mid, data);
    }
  }

  handleClientDisconnect(id) {
    console.log(`CLIENT disconnected : ${id}`);
    if (id in this.client_list) {
      const ch = this.client_list[id];
      const ind = this.channel_list[ch].indexOf(id);
      this.channel_list[ch].splice(ind,1);
      delete this.client_list[id];
    }
  }

  //------------------------------------------------------------------------------------------------

  // PEER SERVER

  onPeerConnected(sock) {
    
    let remoteAddr = sock.remoteAddress;
    console.log(`PEER connecting: ${remoteAddr}`);

    sock.on('data', data=>{
      remoteAddr = this.handlePeerData(sock, remoteAddr, data, 1); // remoteAddr is updated
    });

    sock.on('close', ()=> this.handlePeerDisconnect(sock, remoteAddr));

    sock.on('error', err=>console.log(`PEER ${remoteAddr} error: ${err.message}`));

  }

  onClientConnected(sock, type=1) {
    //console.log(JSON.stringify(this));

    const id = uuid4();
    let event='';

    if(type===2){
      sock.write=sock.send;
      event='message';
      console.log(`CLIENT-WEBSOCK connected: ${id}`);
    }
    else{
      event='data'
      console.log(`CLIENT-CLI connected: ${id}`);
    }

    sock.on(event, data=> this.handleClientData(sock, data,id));

    sock.on('close', ()=> this.handleClientDisconnect(id));

    sock.on('error', err=>console.log(`CLIENT ${id} error: ${err.message}`));
  }


};

module.exports = { BaseServer }
