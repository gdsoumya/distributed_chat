const net = require('net');
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

const startChat = ()=>{
    rl.prompt();
    rl.on('line', function(line) {
        if (line === "exit") rl.close();
        client.write(line)
        rl.prompt();
    }).on('close',function(){
        process.exit(0);
    });
}

const args = process.argv.slice(2);

// Configuration parameters
const HOST = args[0];
const PORT = args[1];

const client = new net.Socket();

client.connect(PORT, HOST, ()=>{
    console.log(`Client connected to: ${HOST}:${PORT}`);
});

client.on('data', (data)=>{
    console.log(`MSG: ${data}`);
     if (data.toString().endsWith('exit')) {
       client.destroy();
    }
});

// Add a 'close' event handler for the client socket
client.on('close', ()=>{
    console.log('Client closed');
    process.exit();
});

client.on('error', (err)=>{
    console.error(err);
    process.exit();
});

client.on('connect', (data)=>{
	startChat(); 
});

