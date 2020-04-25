const WebSocket = require('ws')
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

const startChat = ()=>{
    rl.prompt();
    rl.on('line', function(line) {
        if (line === "exit") rl.close();
        ws.send(line)
        rl.prompt();
    }).on('close',function(){
        process.exit(0);
    });
}

const args = process.argv.slice(2);

// Configuration parameters
const HOST = args[0];
const PORT = args[1];

const ws = new WebSocket(`ws://${HOST}:${PORT}`)

ws.on('open', () => {
	console.log('Client connected to: ' + HOST + ':' + PORT);
	startChat();
});

ws.on('message', (data) => {
  console.log('MSG: ' + data);
    if (data.toString().endsWith('exit')) {
       ws.close();
    }
});

ws.on('close', ()=>{
    console.log('Client closed');
    process.exit();
});

ws.on('error', (err)=>{
    console.error(err);
    process.exit();
});