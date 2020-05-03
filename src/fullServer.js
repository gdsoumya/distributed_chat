/*

FULL-SERVER : Uses both TCP and WebSocket connection for peers thus any client can connect to this server.
FULL-SERVERS can peer with other CLI-SERVERS, WEB-SERVERS and FULL-SERVERS

*/

// imports
const webSocketServer = require('ws').Server;
const net = require('net');
const readline = require('readline');
const uuid4 = require("uuid").v4;

const server = {}

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

const handleClientDisconnect = (id)=>{
  console.log(`CLIENT disconnected : ${id}`);
  if(id in client_list){
    const ch = client_list[id];
    const ind = channel_list[ch].indexOf(id);
    channel_list[ch].splice(ind,1);
    delete client_list[id];
  }
};

server.FullServer = ({ host, serverPeerPort, clientSocketPort, clientWebSocketPort }) => {

  //------------------------------------------------------------------------------------------------

  // WEBSOCK CLIENT Server

  console.log(`CLIENT WEBSOCK Server listening on ${host}:${clientWebSocketPort}`);
  const ws_server = new webSocketServer({host, port:clientWebSocketPort});

  ws_server.on('connection', (connection)=>{

    const id = uuid4();
    connection.write=connection.send;

    console.log(`CLIENT-WEBSOCK connected: ${id}`);

    connection.on('message', data=>handleClientData(connection, data,id));

    connection.on('close', ()=>handleClientDisconnect(id));
  });


  // CLI Client Server

  const onClientConnected = (sock)=>{

    //var id = sock.remoteAddress + ':' + sock.remotePort;
    const id = uuid4();

    console.log(`CLIENT-CLI connected: ${id}`);

    sock.on('data', data=>handleClientData(sock, data,id));

    sock.on('close', ()=>handleClientDisconnect(id));

    sock.on('error', err=>console.log(`CLIENT ${id} error: ${err.message}`));
  };

  server.cli_server = net.createServer(onClientConnected);
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

  server.peer_server = net.createServer(onPeerConnected);
  server.peer_server.listen(serverPeerPort, host, ()=>{
    console.log(`PEER Server listening on ${host}:${serverPeerPort}`);
  });


  // ADD PEER
  const addPeer = (host, port)=>{

    host = host.replace("localhost","127.0.0.1");
    const remoteAddr = host+':'+ port; 

    if(remoteAddr===`${host}:${serverPeerPort}`)
      return;

    const client = new net.Socket();
    
    client.connect(port, host, ()=>{
      console.log(`PEER connecting: ${remoteAddr}`);
      client.write(`connect**@#@${serverPeerPort}`);
    });
     
    client.on('data', data=>handlePeerData(client, remoteAddr, data, 2));

    client.on('close', ()=>handlePeerDisconnect(client, remoteAddr));

    client.on('error', err=>console.log(`PEER ${remoteAddr} error: ${err.message}`));

  };

    //Listen for CMD Input
  sendCMD();
}

module.exports = server
