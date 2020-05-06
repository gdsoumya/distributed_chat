/*

CLI-SERVER : Only uses TCP connection thus only cli-clients can connect to this server.
CLI-SERVERS can peer with other CLI-SERVERS, WEB-SERVERS and FULL-SERVERS


*/

const { BaseServer } = require('./serverUtils');

// imports
const webSocketServer = require('ws').Server;
const net = require('net');
const uuid4 = require('uuid').v4;

//UTIL FUNCTIONS 

//------------------------------------------------------------------------------------------------

const server = {};

//------------------------------------------------------------------------------------------------

// CLI Client Server

server.FullServer = class extends BaseServer {

  constructor({ host, serverPeerPort, clientSocketPort, clientWebSocketPort }) {
    super({ host, serverPeerPort });

    // Save these in case we need them in more specialized servers later
    this.clientSocketPort = clientSocketPort;
    this.clientWebSocketPort = clientWebSocketPort;

    if (clientWebSocketPort) {
      console.log(`CLIENT WEBSOCK Server listening on ${host}:${clientWebSocketPort}`);
      const ws_server = new webSocketServer({host, port:clientWebSocketPort});

      ws_server.on('connection', (connection)=>{

        const id = uuid4();
        connection.write=connection.send;

        console.log(`CLIENT-WEBSOCK connected: ${id}`);

        connection.on('message', data=> this.handleClientData(connection, data,id));

        connection.on('close', ()=> this.handleClientDisconnect(id));
      });

    }
    
    if (clientSocketPort) {
      const cli_server = net.createServer(this.onClientConnected);
      cli_server.listen(clientSocketPort, host, ()=>{
        console.log(`CLIENT CLI Server listening on ${host}:${clientSocketPort}`);
      });


      const peer_server = net.createServer(this.onPeerConnected);
      peer_server.listen(serverPeerPort, host, ()=>{
        console.log(`PEER Server listening on ${host}:${serverPeerPort}`);
      });

    }

    if (!clientSocketPort && !clientWebSocketPort) {
      console.error('Please specify either clientSocketPort, clientWebSocketPort, or both.')
    } else {
      this.sendCMD();
    }
  }
  
  onClientConnected(sock) {

    //var id = sock.remoteAddress + ':' + sock.remotePort;
    const id = uuid4();

    console.log(`CLIENT-CLI connected: ${id}`);

    sock.on('data', data=> this.handleClientData(sock, data,id));

    sock.on('close', ()=> this.handleClientDisconnect(id));

    sock.on('error', err=>console.log(`CLIENT ${id} error: ${err.message}`));
  };

}

module.exports = server
