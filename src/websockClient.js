const { BaseClient } = require('./clientUtils');

const client = {}

// A wrapper class so that Browser websocket behaves like websocket
const WebWebSocket = class {
 
  constructor(url, protocols, options) {
    this.connection = new window.WebSocket(url, protocols, options);
    // TODO check whether Browser websocket supports protocols and options params like ws
    this.url = url; 
  }

  on(event, cb) {
    if (event === 'open') {
      this.connection.onopen = cb;
    } else if (event === 'close') {
      this.connection.onclose = cb;
    } else if (event === 'error') {
      this.connection.onerror = cb;
    } else if (event === 'message') {
      this.connection.onmessage = cb;
    }
  }

  send(data) {
    return this.connection.send(data)
  }

}

// Auto
client.WebSocketClass = (() => {
  try {
    if ((typeof window !== undefined) && (typeof window.WebSocket !== undefined)) {
      console.log("Detected a browser, using browser WebSocket object");
      return WebWebSocket;
    }
  } catch {
    // if window is not defined, fall through here
  }
  try {
    const ws = require('ws');
    return ws;
  } catch {
  }

  throw new Error('Neither Browser WebSocket object nor ws library found.');
})()

/**
 * Class for a websocket client. Pass in the WebSocket class
 * to use, which may be the built-in browser one, or
 * an npm library like ws.
 */
client.WebSocketClient = class extends BaseClient {
  constructor({ host, port, protocols, options, useWSS }) {
    super(new client.WebSocketClass(
      `${useWSS ? 'wss' : 'ws'}://${host}:${port}`, protocols, options
    ), host, port);

    // For clientUtils which will treat bare TCP sockets and WS the same
		this.connection.write = this.connection.send;
  }

  addMessageListener(listener) {
    this.connection.on('message',  (data) => {
      listener(data);
    });
  }

  sendJsonData(jsonData) {
    return this.connection.send(JSON.stringify(sendData));
  }

  on(eventName, cb) {
    return this.connection.on(eventName, cb);
  }

}

module.exports = client
