/*

CLI-SERVER : Only uses TCP connection thus only cli-clients can connect to this server.
CLI-SERVERS can peer with other CLI-SERVERS, WEB-SERVERS and FULL-SERVERS


*/

const args = process.argv.slice(2);

// Configuration parameters
const host             = args[0];
const clientSocketPort = args[1];
const serverPeerPort   = args[2];

const { Server } = require('..')

// Passing in only clientSocketPort and not webSocketPort will only open a socket
// to listen to normal command-line TCP clients.
Server({ host, clientSocketPort, serverPeerPort });
