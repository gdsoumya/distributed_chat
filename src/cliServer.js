/*

CLI-SERVER : Only uses TCP connection thus only cli-clients can connect to this server.
CLI-SERVERS can peer with other CLI-SERVERS, WEB-SERVERS and FULL-SERVERS


*/

// imports
const net = require('net');
const readline = require('readline');
const uuid4 = require("uuid").v4;

const client_list={};
const channel_list={};
const peer_list={};
const msg_list={};

//UTIL FUNCTIONS 

//------------------------------------------------------------------------------------------------

const cliServer = {};

cliServer.HOST = "localhost";
cliServer.SERVER_PEER_PORT = 30303; // default, change to VPN port number if you are on your laptop

// ADD PEER
cliServer.addPeer = (host, port)=>{

  host = host.replace("localhost","127.0.0.1");
  const remoteAddr = host+':'+ port; 

  if(remoteAddr===`${cliServer.HOST}:${cliServer.SERVER_PEER_PORT}`)
    return;

  const client = new net.Socket();
  
  client.connect(port, host, ()=>{
    console.log(`PEER connecting: ${remoteAddr}`);
    client.write(`connect**@#@${port}`);
  });
   
  client.on('data', data=> cliServer.handlePeerData(client, remoteAddr, data, 2));

  client.on('close', ()=> cliServer.handlePeerDisconnect(client, remoteAddr));

  client.on('error', err=>console.log(`PEER ${remoteAddr} error: ${err.message}`));

};

//Read cmd input
cliServer.sendCMD = ()=>{
  const rl = readline.createInterface(process.stdin, process.stdout);
  rl.prompt();
  rl.on('line', function(line) {
      if (line === "exit"){
        rl.close();
        process.exit();
      }
      const cmd=line.split(" ");
      if(cmd.length===3 && cmd[0]==="connect")
        cliServer.addPeer(cmd[1],cmd[2])
      else if(cmd.length===1 && cmd[0]==="peers"){
        const peers=Object.keys(peer_list);
        if(peers.length>0){
          console.log(`CONENCTED PEERS (${peers.length}):`);
          peers.forEach((k,i)=>console.log(`${i+1}. ${k}`))
        }
        else
          console.log("No Peers Connected !");
      }
      rl.prompt();
  }).on('close',function(){
      process.exit(0);
  });
};

// Transfers peerlist to new peer
cliServer.sendPeers = (sock, remoteAddr)=>{
    setTimeout(()=>{
      for(p in peer_list)
          if(p!=remoteAddr)
            sock.write(`peer**@#@${p}`);
    },1000)
};

//Gnerates unique message id
cliServer.genMIG = ()=>{
    const id = uuid4().replace("-","")+":"+new Date().getTime();
    return id;
};

//broadcast messages to clients and peers
cliServer.pushMessage = (src, cid, mid, data, chn="")=>{
  const ch = cid==="" ? chn : client_list[cid];
  if(ch in channel_list)
    for(sock of channel_list[ch])
      if(src!=sock)
        sock.write(data);
  for(p in peer_list)
    if(p!=src)
      peer_list[p].write(`${ch}**@#@${mid}**@#@${data}`);
};


cliServer.handlePeerData = (sock, remoteAddr, data, type)=>{
  data = data.toString();
  console.log(`FROM PEER: ${remoteAddr} - ${data}`);
  const msg = data.split("**@#@");
  if(remoteAddr in peer_list){
    if( msg.length===3){
      if(!(msg[1] in msg_list)){
        cliServer.pushMessage(remoteAddr,"",msg[1],msg[2],msg[0]);
        msg_list[msg[1]]=1;
      }
    }
    else if(msg.length===2 && msg[0]==="peer"){
      if(!(msg[1] in peer_list)){
        const peer = msg[1].split(":");
        cliServer.addPeer(peer[0],peer[1]);
      }
    }
  }else if(type===2 && msg.length===1 && msg[0]==="ok"){
      peer_list[remoteAddr]=sock;
      console.log(`Connected with : ${remoteAddr}`);
      cliServer.sendPeers(sock, remoteAddr);
  }
  else if(type===1 && msg.length===2 && msg[0]==="connect"){
    remoteAddr = remoteAddr+":"+msg[1];
    peer_list[remoteAddr]=sock;
    sock.write("ok");
    console.log(`Connected with : ${remoteAddr}`);
    cliServer.sendPeers(sock,remoteAddr);
  }
  else{
    console.log(`ERROR MSG : ${data}`);
    sock.write("error");
    sock.destroy();
  }
  return remoteAddr;
};


cliServer.handlePeerDisconnect = (sock, remoteAddr)=>{
  console.log(`PEER Disconnected : ${remoteAddr}`);
  delete peer_list[remoteAddr];
  sock.destroy();
}

cliServer.handleClientData = (sock, data, id)=>{
  let ch=""
  try{
    ch = JSON.parse(data);
  }
  catch{
      sock.write(JSON.stringify({type:"error", msg:"MALFORMED DATA"}));
      return;
  }
  if(!(id in client_list)){
    if(ch.type!="join")
      sock.write(JSON.stringify({type:"error", msg:"MALFORMED DATA"}));
    else{
      client_list[id]=ch.cname;
      if(ch.cname in channel_list)
        channel_list[ch.cname].push(sock);
      else
        channel_list[ch.cname]=[sock];
      console.log(`CLIENT ${id} | UNAME : ${ch.uname} JOINED`);
      sock.write(JSON.stringify({type:"success", msg:`Connected to channel ${ch.cname}`}));
    }
  }
  else if(ch.type==="msg"){
    console.log("pushing message",id,ch.uname, ch.msg);
    const mid = genMIG();
    msg_list[mid]=1;
    pushMessage(sock,id, mid, data);
  }
};

cliServer.handleClientDisconnect = (id)=>{
  console.log(`CLIENT disconnected : ${id}`);
  if(id in client_list){
    const ch = client_list[id];
    const ind = channel_list[ch].indexOf(id);
    channel_list[ch].splice(ind,1);
    delete client_list[id];
  }
};

//------------------------------------------------------------------------------------------------

// CLI Client Server

cliServer.onClientConnected = (sock)=>{

  //var id = sock.remoteAddress + ':' + sock.remotePort;
  const id = uuid4();

  console.log(`CLIENT-CLI connected: ${id}`);

  sock.on('data', data=> cliServer.handleClientData(sock, data,id));

  sock.on('close', ()=> cliServer.handleClientDisconnect(id));

  sock.on('error', err=>console.log(`CLIENT ${id} error: ${err.message}`));
};

cliServer.CommandLineServer = ({ host, serverPeerPort, clientSocketPort }) => {

  cliServer.HOST = host;
  cliServer.SERVER_PEER_PORT = serverPeerPort;
  cliServer.CLIENT_SOCKET_PORT = clientSocketPort;

  const cli_server = net.createServer(cliServer.onClientConnected);
  cli_server.listen(clientSocketPort, host, ()=>{
    console.log(`CLIENT CLI Server listening on ${host}:${clientSocketPort}`);
  });


  // PEER SERVER

  const onPeerConnected = sock=>{
    
    let remoteAddr = sock.remoteAddress;
    console.log(`PEER connecting: ${remoteAddr}`);

    sock.on('data', data=>{
      remoteAddr = cliServer.handlePeerData(sock, remoteAddr, data, 1); // remoteAddr is updated
    });

    sock.on('close', ()=> cliServer.handlePeerDisconnect(sock, remoteAddr));

    sock.on('error', err=>console.log(`PEER ${remoteAddr} error: ${err.message}`));

  };

  const peer_server = net.createServer(onPeerConnected);
  peer_server.listen(serverPeerPort, host, ()=>{
    console.log(`PEER Server listening on ${host}:${serverPeerPort}`);
  });

  cliServer.sendCMD();

}

module.exports = cliServer