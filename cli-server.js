/*

CLI-SERVER : Only uses TCP connection thus only cli-clients can connect to this server.
CLI-SERVERS can peer with other CLI-SERVERS, WEB-SERVERS and FULL-SERVERS


*/

// imports
const net = require('net');
const readline = require('readline');
const uuid4 = require("uuid").v4;

const args = process.argv.slice(2);

// Configuration parameters
const HOST = args[0];
const PORT1 = args[1];
const PORT2 = args[2];


const client_list={};
const channel_list={};
const peer_list={};
const msg_list={};

//UTIL FUNCTIONS 

//------------------------------------------------------------------------------------------------

//Read cmd input
const sendCMD = ()=>{
  const rl = readline.createInterface(process.stdin, process.stdout);
  rl.prompt();
  rl.on('line', function(line) {
      if (line === "exit"){
        rl.close();
        process.exit();
      }
      const cmd=line.split(" ");
      if(cmd.length===3 && cmd[0]==="connect")
        addPeer(cmd[1],cmd[2])
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
const sendPeers = (sock, remoteAddr)=>{
    setTimeout(()=>{
      for(p in peer_list)
          if(p!=remoteAddr)
            sock.write(`peer**@#@${p}`);
    },1000)
};

//Gnerates unique message id
const genMIG = ()=>{
    const id = uuid4().replace("-","")+":"+new Date().getTime();
    return id;
};

//broadcast messages to clients and peers
const pushMessage = (src, cid, mid, data, chn="")=>{
  const ch = cid==="" ? chn : client_list[cid];
  if(ch in channel_list)
    for(sock of channel_list[ch])
      if(src!=sock)
        sock.write(data);
  for(p in peer_list)
    if(p!=src)
      peer_list[p].write(`${ch}**@#@${mid}**@#@${data}`);
};


const handlePeerData = (sock, remoteAddr, data, type)=>{
  data = data.toString();
  console.log(`FROM PEER: ${remoteAddr} - ${data}`);
  const msg = data.split("**@#@");
  if(remoteAddr in peer_list){
    if( msg.length===3){
      if(!(msg[1] in msg_list)){
        pushMessage(remoteAddr,"",msg[1],msg[2],msg[0]);
        msg_list[msg[1]]=1;
      }
    }
    else if(msg.length===2 && msg[0]==="peer"){
      if(!(msg[1] in peer_list)){
        const peer = msg[1].split(":");
        addPeer(peer[0],peer[1]);
      }
    }
  }else if(type===2 && msg.length===1 && msg[0]==="ok"){
      peer_list[remoteAddr]=sock;
      console.log(`Connected with : ${remoteAddr}`);
      sendPeers(sock, remoteAddr);
  }
  else if(type===1 && msg.length===2 && msg[0]==="connect"){
    remoteAddr = remoteAddr+":"+msg[1];
    peer_list[remoteAddr]=sock;
    sock.write("ok");
    console.log(`Connected with : ${remoteAddr}`);
    sendPeers(sock,remoteAddr);
  }
  else{
    console.log(`ERROR MSG : ${data}`);
    sock.write("error");
    sock.destroy();
  }
  return remoteAddr;
};


const handlePeerDisconnect = (sock, remoteAddr)=>{
  console.log(`PEER Disconnected : ${remoteAddr}`);
  delete peer_list[remoteAddr];
  sock.destroy();
}

const handleClientData = (sock, data, id)=>{
  data = data.toString();
  if(!(id in client_list)){
    const ch = data.split(" ");
    if(ch.length!=2 || ch[0]!="join")
      sock.write("Malformed");
    else{
      client_list[id]=ch[1];
      if(ch[1] in channel_list)
        channel_list[ch[1]].push(sock);
      else
        channel_list[ch[1]]=[sock];
      console.log(`CLIENT ${id} Says: ${data}`);
      sock.write(`Connected to channel ${ch[1]}`);
    }
  }
  else{
    console.log("pushing message",id,data);
    const mid = genMIG();
    msg_list[mid]=1;
    pushMessage(sock,id, mid, data);
  }
};

const handleClientDisconnect = (id)=>{
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

const onClientConnected = (sock)=>{

  //var id = sock.remoteAddress + ':' + sock.remotePort;
  const id = uuid4();

  console.log(`CLIENT-CLI connected: ${id}`);

  sock.on('data', data=>handleClientData(sock, data,id));

  sock.on('close', ()=>handleClientDisconnect(id));

  sock.on('error', err=>console.log(`CLIENT ${id} error: ${err.message}`));
};

const cli_server = net.createServer(onClientConnected);
cli_server.listen(PORT1, HOST, ()=>{
  console.log(`CLIENT CLI Server listening on ${HOST}:${PORT1}`);
});


// PEER SERVER

const onPeerConnected = sock=>{
  
  let remoteAddr = sock.remoteAddress;
  console.log(`PEER connecting: ${remoteAddr}`);

  sock.on('data', data=>{
    remoteAddr = handlePeerData(sock, remoteAddr, data, 1); // remoteAddr is updated
  });

  sock.on('close', ()=>handlePeerDisconnect(sock, remoteAddr));

  sock.on('error', err=>console.log(`PEER ${remoteAddr} error: ${err.message}`));

};

const peer_server = net.createServer(onPeerConnected);
peer_server.listen(PORT2, HOST, ()=>{
  console.log(`PEER Server listening on ${HOST}:${PORT2}`);
});


// ADD PEER
const addPeer = (host, port)=>{

  host = host.replace("localhost","127.0.0.1");
  const remoteAddr = host+':'+ port; 

  if(remoteAddr===`${HOST}:${PORT2}`)
    return;

  const client = new net.Socket();
  
  client.connect(port, host, ()=>{
    console.log(`PEER connecting: ${remoteAddr}`);
    client.write(`connect**@#@${PORT2}`);
  });
   
  client.on('data', data=>handlePeerData(client, remoteAddr, data, 2));

  client.on('close', ()=>handlePeerDisconnect(client, remoteAddr));

  client.on('error', err=>console.log(`PEER ${remoteAddr} error: ${err.message}`));

};

//Listen for CMD Input
sendCMD();