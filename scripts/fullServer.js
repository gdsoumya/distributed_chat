/*

FULL-SERVER : Uses both TCP and WebSocket connection for peers thus any client can connect to this server.
FULL-SERVERS can peer with other CLI-SERVERS, WEB-SERVERS and FULL-SERVERS

*/
const { FullServer } = require('..')

const args = process.argv.slice(2);

// Configuration parameters
const host                = args[0].replace("localhost","127.0.0.1");
const clientSocketPort    = args[1];
const clientWebSocketPort = args[2];
const serverPeerPort      = args[3];

new FullServer({ host, clientSocketPort, clientWebSocketPort, serverPeerPort });
