// This test client uses WebSocketClient and passes in lines from stdin
// to make it easier for automated tests, instead of listening for keypresses.
const { WebSocketClient, messageConsoleLogger } = require('..');

const { List } = require('immutable');
const fs = require('fs');
const ws = require('ws');
const args = process.argv.slice(2);

const stdinBuffer = fs.readFileSync(0);

// Configuration parameters
const HOST    = args[0];
const PORT    = args[1];
const USE_WSS = args[2];

const wsc = new WebSocketClient({ host: HOST, port: PORT, useWSS: USE_WSS === 'true' });

//Optional listener to retrieve data

wsc.addMessageListener(messageConsoleLogger);

// This is the default action for chats
wsc.on('open', async () => {
	console.log(`Client connected to: ${wsc.host}:${wsc.port}`);
	wsc.start();
  await processStdin();
  wsc.stop(); 
  process.exit(0);
});

wsc.on('close', ()=>{
	console.log('Client closed');
	process.exit(0);
});

wsc.on('error', (err)=>{
	console.error(err);
	process.exit(0);
});

const processStdin = async () => {
  const lines = List(stdinBuffer.toString().split('\n'));

  await lines.reduce(async (sum, line, i) => {
    return sum.then(() => new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Sending line ${i}\n${line}`);
        resolve(wsc.processLine(line));
      }, 500*i);
    }))
  }, Promise.resolve(true));
}
