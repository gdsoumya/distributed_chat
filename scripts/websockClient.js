const { WebSocketClient } = require('..')
const args = process.argv.slice(2);

// Configuration parameters
const HOST = args[0];
const PORT = args[1];

wsc = WebSocketClient({ host: HOST, port: PORT })
