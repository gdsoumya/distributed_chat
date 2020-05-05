const net = require('net');
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

const { startChat, getUserName } = require('./client')

const cli = {}

cli.CommandLineClient = ({ host, port }) => {
  const client = new net.Socket();

  client.connect(port, host, ()=>{
    console.log(`Client connected to: ${host}:${port}`);
  });

  client.on('data', (data)=>{
    data = JSON.parse(data)
    if (data.type==='msg')
      console.log(`${data['getUsername()']}: ${data['msg']}`);
    else if(data.type==='error')
      console.log(`ERROR : ${data['msg']}`);
    else if(data.type==='success')
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
    cli.startChat(client); 
  });

}

module.exports = cli;
