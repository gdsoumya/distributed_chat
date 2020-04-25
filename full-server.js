/*

FULL-SERVER : Uses both TCP and WebSocket connection for peers thus any client can connect to this server.
FULL-SERVERS can peer with other CLI-SERVERS, WEB-SERVERS and FULL-SERVERS

*/

// imports
const webSocketServer = require('ws').Server;
const net = require('net');
const readline = require('readline');
const uuid4 = require("uuid").v4;

const rl = readline.createInterface(process.stdin, process.stdout);


const args = process.argv.slice(2);

// Configuration parameters
const HOST = args[0];
const PORT1 = args[1];
const PORT2 = args[2];
const PORT3 =args[3];

const client_list={};
const channel_list={};
const peer_list={};
const msg_list={};

//UTIL Functions

//Read cmd input
const sendCMD = ()=>{
  rl.prompt();
  rl.on('line', function(line) {
      if (line === "exit"){
        rl.close();
        process.exit();
      }
      const cmd=line.split(" ");
      if(cmd[0]==="connect" && cmd.length===3)
        addPeer(cmd[1],cmd[2])
      rl.prompt();
  }).on('close',function(){
      process.exit(0);
  });
};

// Peer List transfer
const sendPeers = (sock, remoteAddr)=>{
    setTimeout(()=>{
      for(p in peer_list)
          if(p!=remoteAddr)
            sock.write("peer"+"**@#@"+p);
    },1000)
};

//Gnerates unique message id
const genMIG = ()=>{
    const id = uuid4().replace("-","")+":"+new Date().getTime();
    return id;
};

//push messages
const pushMessage = (src, cid, mid, data, chn="")=>{
  const ch = cid===""?chn:client_list[cid];
  if(ch in channel_list)
    for(sock of channel_list[ch])
      if(src!=sock)
        sock.write(data);
  for(p in peer_list)
    if(p!=src)
      peer_list[p].write(ch+"**@#@"+mid+"**@#@"+data);
};

//Listen for CMD Input
sendCMD();


// WebSocket Server connected with http server

const ws_server = new webSocketServer({host:HOST, port:PORT2});

ws_server.on('connection', (connection)=>{

  const id = uuid4();

  connection.write=connection.send;
 
  console.log("client connected : ", id)

  connection.on('message', (data)=>{
      if(!(id in client_list)){
        let ch = data.split(" ");
        console.log(ch)
        if(ch.length!=2 || ch[0]!="join")
          connection.write("Malformed");
        else{
          client_list[id]=ch[1];
          if(ch[1] in channel_list)
            channel_list[ch[1]].push(connection);
          else
            channel_list[ch[1]]=[connection];
          console.log('%s Says: %s', id, data);
          connection.write("Connected to channel "+ch[1]);
        }
      }
      else{
        console.log("pushing message",id,data);
        const mid = genMIG();
        msg_list[mid]=1;
        pushMessage(connection, id, mid, data);
      }
  });
  // user disconnected
  connection.on('close', (conn)=>{
    console.log('connection from %s closed', id);
    if(id in client_list){
      const ch = client_list[id];
      const ind = channel_list[ch].indexOf(id);
      channel_list[ch].splice(ind,1);
      delete client_list[id];
    }
  });
});

// CLI Client Server

const onClientConnected = (sock)=>{

  //var id = sock.remoteAddress + ':' + sock.remotePort;

  const id = uuid4();

  console.log('new client connected: %s', id);

  sock.on('data', (data)=>{
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
        console.log('%s Says: %s', id, data);
        sock.write("Connected to channel "+ch[1]);
      }
    }
    else{
      console.log("pushing message",id,data);
      const mid = genMIG();
      msg_list[mid]=1;
      pushMessage(sock,id, mid, data);
    }
  });

  sock.on('close',  ()=>{
    console.log('connection from %s closed', id);
    if(id in client_list){
      const ch = client_list[id];
      const ind = channel_list[ch].indexOf(id);
      channel_list[ch].splice(ind,1);
      delete client_list[id];
    }
  });

  sock.on('error', (err)=>{
    console.log('Connection %s error: %s', id, err.message);
  });
};

const cli_server = net.createServer(onClientConnected);

cli_server.listen(PORT1, HOST, ()=>{
  console.log('server listening on %j', cli_server.address());
});



// Server to handle Peer Connections

const onPeerConnected = (sock)=>{
  let remoteAddr = sock.remoteAddress;
  console.log('new PEER connecting: %s', remoteAddr);

  sock.on('data', (data)=>{
    data = data.toString();
    console.log("FROM PEER : ",remoteAddr, data)
    const msg = data.split("**@#@");
    if(remoteAddr in peer_list){
      if(msg.length===3){
        if(!(msg[1] in msg_list)){
          pushMessage(remoteAddr,"",msg[1],msg[2],msg[0]);
          msg_list[msg[1]]=1;
        }
      }
    }
    else if(msg.length===2 && msg[0]==="connect"){
        remoteAddr = remoteAddr+":"+msg[1];
        peer_list[remoteAddr]=sock;
        sock.write("ok");
        console.log("Connected with : "+remoteAddr);
        sendPeers(sock,remoteAddr);
    }
    else if(msg.length===2 && msg[0]==="peer"){
      if(!(msg[1] in peer_list)){
        const peer = msg[1].split(":");
        addPeer(peer[0],peer[1]);
      }
    }
    else{
      sock.write("error1");
      sock.destroy();
    }
  });

  sock.on('close',  ()=>{
    console.log(remoteAddr+ " Disconnected");
    delete peer_list[remoteAddr];
    sock.destroy();
  });

  sock.on('error', (err)=>{
    console.log('Connection %s error: %s', remoteAddr, err.message);
  });
};

const peer_server = net.createServer(onPeerConnected);

peer_server.listen(PORT3, HOST, ()=>{
  console.log('server listening on %j', peer_server.address());
});


// ADD PEER

const addPeer = (HOST, PORT)=>{
  
  const client = new net.Socket();
  
  HOST = HOST.replace("localhost","127.0.0.1");

  const remoteAddr = HOST+':'+ PORT; 
  
  client.connect(PORT, HOST, ()=>{
    console.log('Connecting to: ' + remoteAddr);
    client.write('connect**@#@'+PORT3);
  });
   
  client.on('data', (data)=>{    
    data = data.toString();
    console.log("FROM PEER: ",remoteAddr,data);
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
    }else if(msg.length===1 && msg[0]==="ok"){
        peer_list[remoteAddr]=client;
        console.log("Connected with : "+remoteAddr,Object.keys(peer_list));
        sendPeers(client, remoteAddr);
    }
    else{
      client.write("error");
      client.destroy();
    }
  });

  client.on('close',  ()=> {
    console.log(remoteAddr+ " Disconnected");
    delete peer_list[remoteAddr];
    client.destroy();
  });

  client.on('error', (err)=>{
    console.log('Connection %s error: %s', remoteAddr, err.message);
  });

};

