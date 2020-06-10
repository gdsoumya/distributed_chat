const { WebSocketClient, messageConsoleLogger } = require('..');
const ws = require('ws');
const args = process.argv.slice(2);

// Configuration parameters
const HOST = args[0];
const PORT = args[1];

const wsc = new WebSocketClient({ host: HOST, port: PORT, useWSS: true });

//Optional listener to retrieve data

wsc.addMessageListener(messageConsoleLogger);

// This is the default action for chats
wsc.on('open', (ws) => {
	console.log(`Client connected to: ${wsc.host}:${wsc.port}`);
  wsc.startChat(ws);
});

wsc.on('close', ()=>{
	console.log('Client closed');
	process.exit();
});

wsc.on('error', (err)=>{
	console.error(err);
	process.exit();
});
