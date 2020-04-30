const net = require('net');
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

let uname="", channel="";

const startChat = ()=>{
    rl.prompt();
    rl.on('line', function(line) {
        if (line.toLowerCase() === "exit") rl.close();
        const msg=line.split(" ");
        if(channel==""){
            if(msg.length===3 && msg[0].toLowerCase()==="join"){
                
                const data={type:"join",uname:msg[2], cname:msg[1]}
                channel = msg[1];uname=msg[2];
                console.log(`CHANNEL NAME : ${channel}  |   USERNAME : ${uname}`);
                client.write(JSON.stringify(data));
            }else{
                console.log("PLEASE JOIN A CHANNEL FIRST")
            }
        }else{
            const data = {type:"msg", uname:uname, msg:line};
            client.write(JSON.stringify(data));
        }
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
    data = JSON.parse(data)
    if(data.type==="msg")
        console.log(`${data['uname']}: ${data['msg']}`);
    else if(data.type==="error")
        console.log(`ERROR : ${data['msg']}`);
    else if(data.type==="success")
        console.log(`${data['msg']}`);
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

