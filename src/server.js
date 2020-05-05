/*

CLI-SERVER : Only uses TCP connection thus only cli-clients can connect to this server.
CLI-SERVERS can peer with other CLI-SERVERS, WEB-SERVERS and FULL-SERVERS


*/

const {
  addPeer, sendCMD, sendPeers, genMIG, pushMessage, handlePeerData,
  handlePeerDisconnect, handleClientData, handleClientDisconnect
} = require('')

// imports
const webSocketServer = require('ws').Server;
const net = require('net');
const readline = require('readline');
const uuid4 = require('uuid').v4;

const client_list={};
const channel_list={};
const peer_list={};
const msg_list={};

//UTIL FUNCTIONS 

//------------------------------------------------------------------------------------------------

const server = {};

//------------------------------------------------------------------------------------------------

// CLI Client Server

server.onClientConnected = (sock)=>{

  //var id = sock.remoteAddress + ':' + sock.remotePort;
  const id = uuid4();

  console.log(`CLIENT-CLI connected: ${id}`);

  sock.on('data', data=> server.handleClientData(sock, data,id));

  sock.on('close', ()=> server.handleClientDisconnect(id));

  sock.on('error', err=>console.log(`CLIENT ${id} error: ${err.message}`));
};

// PEER SERVER

const onPeerConnected = sock=>{
  
  let remoteAddr = sock.remoteAddress;
  console.log(`PEER connecting: ${remoteAddr}`);

  sock.on('data', data=>{
    remoteAddr = server.handlePeerData(sock, remoteAddr, data, 1); // remoteAddr is updated
  });

  sock.on('close', ()=> server.handlePeerDisconnect(sock, remoteAddr));

  sock.on('error', err=>console.log(`PEER ${remoteAddr} error: ${err.message}`));

};

server.Server = ({ host, serverPeerPort, clientSocketPort, clientWebSocketPort }) => {

  server.HOST = host;
  server.SERVER_PEER_PORT = serverPeerPort;
  server.CLIENT_SOCKET_PORT = clientSocketPort;

  if (clientWebSocketPort) {
    console.log(`CLIENT WEBSOCK Server listening on ${host}:${clientWebSocketPort}`);
    const ws_server = new webSocketServer({host, port:clientWebSocketPort});

    ws_server.on('connection', (connection)=>{

      const id = uuid4();
      connection.write=connection.send;

      console.log(`CLIENT-WEBSOCK connected: ${id}`);

      connection.on('message', data=>server.handleClientData(connection, data,id));

      connection.on('close', ()=>server.handleClientDisconnect(id));
    });

  }
  
  if (clientSocketPort) {
    const cli_server = net.createServer(server.onClientConnected);
    cli_server.listen(clientSocketPort, host, ()=>{
      console.log(`CLIENT CLI Server listening on ${host}:${clientSocketPort}`);
    });


    const peer_server = net.createServer(onPeerConnected);
    peer_server.listen(serverPeerPort, host, ()=>{
      console.log(`PEER Server listening on ${host}:${serverPeerPort}`);
    });

  }

  if (!clientSocketPort && !clientWebSocketPort) {
    console.error('Please specify either clientSocketPort, clientWebSocketPort, or both.')
  } else {
    server.sendCMD();
  }

}

module.exports = server
