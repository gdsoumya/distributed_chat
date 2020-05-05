/*

FULL-SERVER : Uses both TCP and WebSocket connection for peers thus any client can connect to this server.
FULL-SERVERS can peer with other CLI-SERVERS, WEB-SERVERS and FULL-SERVERS

*/

// imports
const webSocketServer = require('ws').Server;
const net = require('net');
const readline = require('readline');
const uuid4 = require('uuid').v4;

const cliServer = require('./cliServer');

const server = {}

const client_list={};
const channel_list={};
const peer_list={};
const msg_list={};

// FullServer includes both a CLI server and a WebSocket server
server.FullServer = ({ host, serverPeerPort, clientSocketPort, clientWebSocketPort }) => {

  CommandLineServer({ host, host, serverPeerPort, clientSocketPort });

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


  //Listen for CMD Input
  sendCMD();
}

module.exports = server
