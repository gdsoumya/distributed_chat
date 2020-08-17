const net = require('net');
import { ConnectionManager } from './connMan';
import { integer, MessageListener } from '../types'
import { Socket as TCPSocket } from 'net'

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
export class CommandLineConnectionManager extends ConnectionManager {

  private tcpSocket: TCPSocket
  
  constructor(host: string, port: integer) {
    super(() => new net.Socket(), host, port);

    this.tcpSocket = this.connection as TCPSocket

  }

  send(jsonString: string) {
    this.tcpSocket.write(jsonString)
    // Add a 'close' event handler for the client socket
    this.tcpSocket.on('close', () => {
      console.log('Client closed');
      process.exit();
    });

    this.tcpSocket.on('error', (err) => {
      console.error(err);
      process.exit();
    });
  }

  // CLI net clients can connect to a server separately after creating a connection.
  async registerCallbacks() {
    // Add CLI TCP socket specific client logger and connection logic
    this.tcpSocket.connect(this.port, this.host, () => {
      console.log(`Client connected to: ${this.host}:${this.port}`);
    });

  }

  /**
	 * Add a message listener callback function of the form
	 * (jsonData) => { ... }
	 * The net library listens on the event called `data`
	 */
  addMessageListener(listener: MessageListener) {
    this.tcpSocket.on('data', listener);
  }
};