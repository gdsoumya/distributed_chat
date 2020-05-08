const { BaseClient } = require('./clientUtils');

const client = {}

/**
 * Class for a websocket client. Pass in the WebSocket class
 * to use, which may be the built-in browser one, or
 * an npm library like ws.
 */
client.WebSocketClient = class extends BaseClient {
  constructor({ host, port, WebSocket }) {
    super();

    const ws = new WebSocket(`ws://${host}:${port}`);
    this.ws = ws;

    ws.on('open', () => {
      console.log(`Client connected to: ${host}:${port}`);
      ws.write = ws.send;
      this.startChat(ws);
    });

    ws.on('close', ()=>{
      console.log('Client closed');
      process.exit();
    });

    ws.on('error', (err)=>{
      console.error(err);
      process.exit();
    });

  }

  addMessageListener(listener) {
    this.ws.on('message',  (data) => {
      listener(data);
    });
  }

  send(jsonData) {
    ws.send(JSON.stringify(sendData));
  }

}

module.exports = client
