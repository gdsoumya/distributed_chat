const net = require('net');
const { BaseClient, messageConsoleLogger } = require('./clientUtils')

const cli = {}

cli.CommandLineClient = class extends BaseClient {
  constructor({ host, port }) {
    super(new net.Socket(), host, port);

    // Add a 'close' event handler for the client socket
    this.connection.on('close', ()=>{
      console.log('Client closed');
      process.exit();
    });
    
    this.connection.on('error', (err)=>{
      console.error(err);
      process.exit();
    });

    this.connection.on('connect', ()=>{
      super.startChat(this.client); 
    });

  }

  // Call start() after instantiating it
  start() {
    // Add CLI TCP socket specific client logger and connection logic
    this.addMessageListener(messageConsoleLogger);
    this.connection.connect(this.port, this.host, ()=>{
      console.log(`Client connected to: ${this.host}:${this.port}`);
    });
    // Then start up the REPL
    //super.startChat();
  }

  /**
   * Accept a callback listener of the form
   * (JSON data) => { ... }
   */
  addMessageListener(listener) {
    this.connection.on('data',  (data) => {
      listener(data);
    });
  }

}

module.exports = cli;
