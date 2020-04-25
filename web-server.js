const WebSocket = require('ws');
const net = require('net');
var readline = require('readline');
var uuid4 = require("uuid").v4;
var rl = readline.createInterface(process.stdin, process.stdout);

var args = process.argv.slice(2);

// Configuration parameters
var HOST = args[0];
var PORT1 = args[1]; //  port for socket clients
var PORT2 = args[2]; // port for peers
var PORT3 = args[3]; // port for websocket clients

var client_list={};
var channel_list={};
var peer_list={};
var msg_list={}
// Create Server instance for users

const wss = new WebSocket.Server({ port: PORT3, host: HOST });

const server = net.createServer(onClientConnected);

server.listen(PORT1, HOST, function() {
  console.log('server listening on %j', server.address());
});

// Sock shared by both ws-server and net-server
let topSock = null;
let topRemoteAddr = null;
let topWs = null;

const handleData = (data) => {
  data = data.toString();
  if (!topRemoteAddr || !topSock) {
    console.error('Net socket is not connected to push anything out.');
    return
  }
  if (!(topRemoteAddr in client_list)) {
    let ch = data.split(" ");
    console.log(ch)
    if (ch.length!=2 || ch[0]!="join") {
      topSock.write("Malformed");
    } else {
      client_list[topRemoteAddr]=ch[1];
      if (ch[1] in channel_list) {
        channel_list[ch[1]].push(topSock);
      } else {
        channel_list[ch[1]]=[topSock];
        console.log('%s Says: %s', topRemoteAddr, data);
        topSock.write("Connected to channel "+ch[1]);
      }
    }
  } else {
    console.log("pushing message", topRemoteAddr, data);
    let id = genMIG();
    msg_list[id]=1;
    pushMessage(topSock,topRemoteAddr, id, data);
    if (topWs) {
      topWs.send(`${id} ${data}`)
    }
  }
}

wss.on('connection', function connection(ws) {
  topWs = ws;
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    handleData(message);
  });

  console.log('ws server listening');
  ws.send('websocket server connected');
});

function onClientConnected(sock) {
  topSock = sock;
  var remoteAddr = sock.remoteAddress + ':' + sock.remotePort;
  topRemoteAddr = remoteAddr;
  console.log('new client connected: %s', remoteAddr);

  sock.on('data', function(data) {
    handleData(data);
  });

  sock.on('close',  function () {
    console.log('connection from %s closed', remoteAddr);
    if(remoteAddr in client_list){
      var ch = client_list[remoteAddr];
      let ind = channel_list[ch].indexOf(remoteAddr);
      channel_list[ch].splice(ind,1);
      delete client_list[remoteAddr];
    }
  });

  sock.on('error', function (err) {
    console.log('Connection %s error: %s', remoteAddr, err.message);
  });
};

function pushMessage(src, addr, id, data,chn=""){
  let ch = addr===""?chn:client_list[addr];
  if(ch in channel_list)
    for(sock of channel_list[ch])
      if(src!=sock)
        sock.write(data);
  for(p in peer_list)
    peer_list[p].write(ch+"**@#@"+id+"**@#@"+data);
}



// Create Server for peers

var server2 = net.createServer(onServerConnected);

server2.listen(PORT2, HOST, function() {
  console.log('server listening on %j', server2.address());
});

function onServerConnected(sock) {
  var remoteAddr = sock.remoteAddress;
  console.log('new PEER connecting: %s', remoteAddr);

  sock.on('data', function(data) {
    data = data.toString();
    console.log("DATA FROM PEER "+data)
    let msg = data.split("**@#@");
    if(remoteAddr in peer_list){
      if( msg.length===3 && msg[0] in channel_list){
        if(!(msg[1] in msg_list)){
          pushMessage("","",msg[1],msg[2],msg[0]);
          msg_list[msg[1]]=1;
        }
        // for(sock of channel_list[msg[0]])
        //   sock.write(msg[1]);
      }
    }
    else if(msg.length===2 && msg[0]==="connect"){
        remoteAddr = remoteAddr+":"+msg[1];
        peer_list[remoteAddr]=sock;
        sock.write("ok");
        console.log("Connected with : "+remoteAddr,Object.keys(peer_list));
        sendPeers(sock,remoteAddr);
    }
    else if(msg.length===2 && msg[0]==="peer"){
      if(!(msg[1] in peer_list)){
        let peer = msg[1].split(":");
        addPeer(peer[0],peer[1]);
      }
    }
    else{
      sock.write("error1");
      sock.destroy();
    }
  });

  sock.on('close',  function () {
    console.log(remoteAddr+ " Disconnected");
    delete peer_list[remoteAddr];
    sock.destroy();
  });

  sock.on('error', function (err) {
    console.log('Connection %s error: %s', remoteAddr, err.message);
  });
};



// ADD PEER
function addPeer(HOST, PORT){
  
  var client = new net.Socket();
  var remoteAddr = HOST.replace("localhost","127.0.0.1")+ ':' + PORT;

  client.connect(PORT, HOST, function() {
    console.log('Connecting to: ' + HOST + ':' + PORT);
    client.write('connect**@#@'+PORT2);
  });
   
  client.on('data', function(data) {    
    data = data.toString();
    console.log("FROM PEER: ",data);
    let msg = data.split("**@#@");
    if(remoteAddr in peer_list){
      if( msg.length===3 && msg[0] in channel_list){
        if(!(msg[1] in msg_list)){
          pushMessage("","",msg[1],msg[2],msg[0]);
          msg_list[msg[1]]=1;
        }
        // for(sock of channel_list[msg[0]])
        //   sock.write(msg[1]);
      }
      else if(msg.length===2 && msg[0]==="peer"){
        if(!(msg[1] in peer_list)){
          let peer = msg[1].split(":");
          addPeer(peer[0],peer[1]);
        }
      }
    }else if(msg.length===1 && msg[0]==="ok"){
        peer_list[remoteAddr]=client;
        console.log("Connected with : "+remoteAddr,Object.keys(peer_list));
        sendPeers(client);
    }
    else{
      client.write("error");
      client.destroy();
    }
  });

  client.on('close',  function () {
    console.log(remoteAddr+ " Disconnected");
    delete peer_list[remoteAddr];
    client.destroy();
  });

  client.on('error', function (err) {
    console.log('Connection %s error: %s', remoteAddr, err.message);
  });

};

function sendCMD(){
  rl.prompt();
  rl.on('line', function(line) {
      if (line === "exit"){
        rl.close();
        process.exit();
      }
      let cmd=line.split(" ");
      if(cmd[0]==="connect" && cmd.length===3)
        addPeer(cmd[1],cmd[2])
      rl.prompt();
  }).on('close',function(){
      process.exit(0);
  });
}

sendCMD();

function sendPeers(sock, remoteAddr){
    setTimeout(()=>{
      for(p in peer_list)
          if(p!=remoteAddr)
            sock.write("peer"+"**@#@"+p);
    },1000)
}


function genMIG(){
    let id = uuid4().replace("-","")+":"+new Date().getTime();
    return id;
}
