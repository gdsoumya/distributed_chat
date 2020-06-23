const net = require('net');
const { BaseClient } = require('./clientUtils');

const cli = {};

/**
 * How to instantiate a CommandLineClient
 *
 * // Instantiate a new object (not started yet)
 * const c = new CommandLineClient({ host, port })
 *
 * // Register any event handlers, especially the 'connect' event
 * c.on('event', () => {
 *   ...
 * }
 *
 * // Register a message listener, which abstracts away the `data` event
 * c.addMessageListener((data) => {
 *   ...
 * }
 *
 * // Start the client, which opens the connections
 * c.start()
 *
 */
cli.CommandLineClient = class extends BaseClient {
  constructor({ host, port }) {
    super(new net.Socket(), host, port);

    // Add a 'close' event handler for the client socket
    this.connection.on('close', () => {
      console.log('Client closed');
      process.exit();
    });

    this.connection.on('error', (err) => {
      console.error(err);
      process.exit();
    });
  }

  // CLI net clients can connect to a server separately after creating a connection.
  start() {
    // Add CLI TCP socket specific client logger and connection logic
    this.connection.connect(this.port, this.host, () => {
      console.log(`Client connected to: ${this.host}:${this.port}`);
    });
  }

  /**
	 * Add a message listener callback function of the form
	 * (jsonData) => { ... }
	 * The net library listens on the event called `data`
	 */
  addMessageListener(listener) {
    this.on('data', listener);
  }
};

module.exports = cli;
