import WebSocket, { OpenEvent, MessageEvent } from 'isomorphic-ws'
import { integer, JSONDatum } from '../types'
import { ConnectionManager } from './connMan'

/**
 * Class for a websocket client. Pass in the WebSocket class
 * to use, which may be the built-in browser one, or
 * an npm library like ws.
 */
export const WebSocketConnectionManager = class extends ConnectionManager {

  url: string
  wsSocket: WebSocket | null

  constructor({
    host, port, protocols, options, useWSS = true,
  }: {
    host: string,
    port: integer,
    protocols?: any,
    options?: object,
    useWSS?: boolean,
  }) {
    const url = `${useWSS ? 'wss' : 'ws'}://${host}:${port}`
    super(() => new WebSocket(url, protocols, options), host, port);
    this.url = url
    this.wsSocket = null
  }

  async registerCallbacks() {
    return new Promise((resolve) => {
      this.wsSocket = this.connection as WebSocket

      this.wsSocket.onopen = (openEvent: OpenEvent) => {
        console.log('open')
        openEvent.target.onmessage = (msgEvent: MessageEvent) => {
          console.log('message')
          const datum: JSONDatum = JSON.parse(msgEvent.data.toString())
          this.datumListeners.forEach((listener) => listener(datum))
        };
        resolve(true);
      };
    })
  }

  send(data: string) {
    if (this.wsSocket) {
      this.wsSocket.send(data)
    }
  }

  stop() {
    if (this.wsSocket) {
      this.wsSocket.close()
    }
  }

}

export default WebSocketConnectionManager