/*

CLI-SERVER : Only uses TCP connection thus only cli-clients can connect to this server.
CLI-SERVERS can peer with other CLI-SERVERS, WEB-SERVERS and FULL-SERVERS

*/

// imports
const webSocketServer = require('ws').Server;
const net = require('net');
const { BaseServer } = require('./serverUtils');

// UTIL FUNCTIONS

//------------------------------------------------------------------------------------------------

const server = {};

//------------------------------------------------------------------------------------------------

// CLI Client Server

/* eslint-disable camelcase */
server.FullServer = class extends BaseServer {
  constructor({
    host, serverPeerPort, clientSocketPort, clientWebSocketPort,
  }) {
    super({ host, serverPeerPort });

    // Save these in case we need them in more specialized servers later
    this.clientSocketPort = clientSocketPort;
    this.clientWebSocketPort = clientWebSocketPort;

    if (clientWebSocketPort) {
      /* eslint-disable no-console */
      console.log(`CLIENT WEBSOCK Server listening on ${host}:${clientWebSocketPort}`);
      /* eslint-enable no-console */

      /* eslint-disable new-cap */
      const ws_server = new webSocketServer({ host, port: clientWebSocketPort });
      /* eslint-enable new-cap */

      ws_server.on('connection', (connection) => {
        this.onClientConnected(connection, 2);
      });
    }

    if (clientSocketPort) {
      const cli_server = net.createServer(this.onClientConnected.bind(this));
      cli_server.listen(clientSocketPort, host, () => {
        console.log(`CLIENT CLI Server listening on ${host}:${clientSocketPort}`); // eslint-disable-line no-console
      });
    }

    if (!clientSocketPort && !clientWebSocketPort) {
      throw Error('Please specify either clientSocketPort, clientWebSocketPort, or both.');
    } else {
      const peer_server = net.createServer(this.onPeerConnected.bind(this));
      peer_server.listen(serverPeerPort, host, () => {
        console.log(`PEER Server listening on ${host}:${serverPeerPort}`); // eslint-disable-line no-console
      });

      this.sendCMD();
    }
  }
};

module.exports = server;
