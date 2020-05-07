const net = require('net');
const { BaseClient } = require('./clientUtils')

const cli = {}

cli.CommandLineClient = class extends BaseClient {
  constructor({ host, port }) {
    super();
    const client = new net.Socket();

    client.connect(port, host, ()=>{
      console.log(`Client connected to: ${host}:${port}`);
    });

    client.on('data', (data)=>{
      data = JSON.parse(data)
      if (data.type==='msg')
        console.log(`${data['uname']}: ${data['msg']}`);
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

    client.on('connect', ()=>{
      this.startChat(client.write); 
    });

  }
}

module.exports = cli;
