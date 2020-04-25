var net = require('net');
var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);

function startChat(){
    rl.prompt();
    rl.on('line', function(line) {
        if (line === "exit") rl.close();
        client.write(line)
        rl.prompt();
    }).on('close',function(){
        process.exit(0);
    });
}

function loop(){
        while(true)
            client.write("hello");
}
var args = process.argv.slice(2);

// Configuration parameters
var HOST = args[0];
var PORT = args[1];

var client = new net.Socket();

client.connect(PORT, HOST, function() {
    console.log('Client connected to: ' + HOST + ':' + PORT);
    // Write a message to the socket as soon as the client is connected, the server will receive it as message from the clie 
  // input();
});

client.on('data', function(data) {
    console.log('MSG: ' + data);
     if (data.toString().endsWith('exit')) {
       client.destroy();
    }
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
    console.log('Client closed');
    process.exit();
});

client.on('error', function(err) {
    console.error(err);
    process.exit();
});

async function input(){

}
client.on('connect',function(data){
	startChat(); 
    //loop();
});

