/*

CLI-SERVER : Only uses TCP connection thus only cli-clients can connect to this server.
CLI-SERVERS can peer with other CLI-SERVERS, WEB-SERVERS and FULL-SERVERS


*/

const { BaseServer } = require('./serverUtils');

// imports
const webSocketServer = require('ws').Server;
const net = require('net');

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
        this.onClientConnected(connection, 2);
      });

    }
    
    if (clientSocketPort) {
      const cli_server = net.createServer(this.onClientConnected.bind(this));
      cli_server.listen(clientSocketPort, host, ()=>{
        console.log(`CLIENT CLI Server listening on ${host}:${clientSocketPort}`);
      });

    }

    if (!clientSocketPort && !clientWebSocketPort) {
      throw Error('Please specify either clientSocketPort, clientWebSocketPort, or both.')
    } 
    else {
      
      const peer_server = net.createServer(this.onPeerConnected.bind(this));
      peer_server.listen(serverPeerPort, host, ()=>{
        console.log(`PEER Server listening on ${host}:${serverPeerPort}`);
      });

      this.sendCMD();
    }
  }
  
}

module.exports = server
