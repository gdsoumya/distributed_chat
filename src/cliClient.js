const net = require('net');
const { BaseClient } = require('./clientUtils')

const cli = {}

cli.CommandLineClient = class extends BaseClient {
  constructor({ host, port }) {
    super();
    const client = new net.Socket();
    this.client = client;

    client.connect(port, host, ()=>{
      console.log(`Client connected to: ${host}:${port}`);
    });

    client.on('data', (data)=>{
      console.log(this.handleServerData(data));
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
      this.startChat(client); 
    });

  }

  /**
   * Accept a callback listener of the form
   * ({ userName, msg }) => { ... }
   */
  addMessageListener(listener) {
    this.client.on('data',  (data) => {
       listener(this.handleServerData(data));
    });
  }

}

module.exports = cli;
