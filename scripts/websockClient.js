const { WebSocketClient } = require('..');
const ws = require('ws');
const args = process.argv.slice(2);

// Configuration parameters
const HOST = args[0];
const PORT = args[1];

let data="";

const wsc = new WebSocketClient({ host: HOST, port: PORT, WebSocket: ws });

//Optional listener to retrieve data
wsc.addMessageListener(({ userName, message }) => {
  data=`${userName}: ${message}`;
});
