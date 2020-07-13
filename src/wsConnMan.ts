'use strict'

import { ConnectionManager } from './connMan'
import { integer } from './types'
import WebSocket from 'isomorphic-ws'

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
    port: integer,
    protocols: any,
    options: object,
    useWSS: boolean,
  }) {
    let url = `${useWSS ? 'wss' : 'ws'}://${host}:${port}`
    super(new WebSocket(url, protocols, options), host, port);
    this.url = url
  }

};