'use strict'

import { ConnectionManager } from './connMan'
import WebSocket from 'ws'

const { assert } = require('chai');

// A wrapper class so that Browser websocket behaves like websocket
const BrowserWebSocket = class {

  innerConnection: WebSocket
  url: string
  send: (data: string) => void

  constructor(url: string, protocols: array, options: object) {
    // We manage an inner connection, so that we can decorate its event handlers below
    // to be consistent with ws library
    this.innerConnection = new window.WebSocket(url, protocols, options);
    this.send = this.innerConnection.send.bind(this.innerConnection);
    this.url = url;
    return this;
  }

  on(event, cb) {
    if (event === 'open') {
      this.innerConnection.onopen = cb;
    }
    else if (event === 'close') {
      this.innerConnection.onclose = cb;
    }
    else if (event === 'error') {
      this.innerConnection.onerror = cb;
    }
    else if (event === 'message') {
      this.innerConnection.onmessage = cb;
    }
  }

};

// Auto
export const WebSocketClass: Class = (() => {
  try {
    if (typeof window !== undefined && typeof window.WebSocket !== undefined) {
      console.log('Detected a browser, using browser WebSocket object');
      return BrowserWebSocket;
    }
  }
  catch(e) {
    // if window is not defined, fall through here
  }
  try {
    const ws = require('ws');
    return ws;
  }
  catch(e) {
    // if window is not defined, fall through here        
  }

  throw new Error('Neither Browser WebSocket object nor ws library found.');
})();

/**
 * Class for a websocket client. Pass in the WebSocket class
 * to use, which may be the built-in browser one, or
 * an npm library like ws.
 */
export class WebSocketConnectionManager extends ConnectionManager {

  url: string
  send: (data: string) => void

  constructor({ host, port, protocols, options, useWSS }: {
    host: string,
    port: number,
    protocols: any,
    options: object,
    useWSS: boolean,
  }) {
    super(new WebSocketClass(`${useWSS ? 'wss' : 'ws'}://${host}:${port}`, protocols, options), host, port);

    // For clientUtils which will treat bare TCP sockets and WS the same
    this.url = this.connection.url;
    this.connection.write = this.connection.send;
    this.send = this.connection.send;
  }

  /**
     * Add a message listener callback function of the form
     * (jsonData) => { ... }
     * The ws library, and the isomorphic shim above for Browser Websocket,
     * listen on the event called `message`
     */
  addMessageListener(listener: (dataString: string) => void) {
    console.log('Listener added', listener)
    this.on('message', listener);
  }
};
