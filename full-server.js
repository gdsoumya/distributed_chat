
// Port where we'll run the websocket server
var webSocketServer = require('websocket').server;
var http = require('http');
var net = require('net');
var readline = require('readline');
var uuid4 = require("uuid").v4;
var rl = readline.createInterface(process.stdin, process.stdout);


var args = process.argv.slice(2);

// Configuration parameters
var HOST = args[0];
var PORT1 = args[1];
var PORT2 = args[2];
var PORT3 =args[3];

var client_list={};
var channel_list={};
var peer_list={};
var msg_list={};
/**
 * Global variables
 */
var client_list={};
var channel_list={};
var peer_list={};
var msg_list={};

var server = http.createServer(function(request, response) {});

server.listen(PORT2, function() {
  console.log((new Date()) + " Server is listening on port "
      + PORT2);
});
/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
  httpServer: server
});

wsServer.on('request', function(request) {
  //console.log((new Date()) + ' Connection from origin '+ request.origin + '.');

  var connection = request.accept(null, request.origin);

  var id = connection.uuid = uuid4();
  connection.write=connection.sendUTF;
  console.log("client connected : ",connection.uuid)
  connection.on('message', function(data) {
    if (data.type === 'utf8') { 
      data = data.utf8Data;
      if(!(id in client_list)){
        let ch = data.split(" ");
        console.log(ch)
        if(ch.length!=2 || ch[0]!="join")
          connection.sendUTF("Malformed");
        else{
          client_list[id]=ch[1];
          if(ch[1] in channel_list)
            channel_list[ch[1]].push(connection);
          else
            channel_list[ch[1]]=[connection];
          console.log('%s Says: %s', id, data);
          connection.sendUTF("Connected to channel "+ch[1]);
        }
      }
      else{
        console.log("pushing message",id,data);
        let mid = genMIG();
        msg_list[id]=1;
        pushMessage(connection, id, mid, data);
      }
    }
  });
  // user disconnected
  connection.on('close', function(connection) {
    console.log('connection from %s closed', id);
    if(id in client_list){
      var ch = client_list[id];
      let ind = channel_list[ch].indexOf(id);
      channel_list[ch].splice(ind,1);
      delete client_list[id];
    }
  });
});

var server = net.createServer(onClientConnected);

server.listen(PORT1, HOST, function() {
  console.log('server listening on %j', server.address());
});

function onClientConnected(sock) {
  var remoteAddr = sock.remoteAddress + ':' + sock.remotePort;
  console.log('new client connected: %s', remoteAddr);

  sock.on('data', function(data) {
    data = data.toString();
    if(!(remoteAddr in client_list)){
      let ch = data.split(" ");
      console.log(ch)
      if(ch.length!=2 || ch[0]!="join")
        sock.write("Malformed");
      else{
        client_list[remoteAddr]=ch[1];
        if(ch[1] in channel_list)
          channel_list[ch[1]].push(sock);
        else
          channel_list[ch[1]]=[sock];
        console.log('%s Says: %s', remoteAddr, data);
        sock.write("Connected to channel "+ch[1]);
      }
    }
    else{
      console.log("pushing message",remoteAddr,data);
      let id = genMIG();
      msg_list[id]=1;
      pushMessage(sock,remoteAddr, id, data);
    }
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

server2.listen(PORT3, HOST, function() {
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
    client.write('connect**@#@'+PORT3);
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