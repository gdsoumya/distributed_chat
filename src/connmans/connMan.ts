import { List } from 'immutable'

import {
  JSONDatum, DarkChatSocket, integer, DatumListener, DarkChatSocketCreator,
} from '../types'
import { Secp256k1PublicKey } from '../keys'

export const messageConsoleLogger = (datum: JSONDatum): void => {
  const msg = Buffer.isBuffer(datum.msg)
    ? Buffer.from(datum.msg).toString() : JSON.stringify(datum.msg);

  // console.log(_datum);
  if (datum.type === 'msg') {
    if (datum.private) console.log(`${datum.uname}:${datum.pk}:- ${msg}`); // eslint-disable-line no-console
    else console.log(`${datum.uname}:${datum.cname}- ${msg}`); // eslint-disable-line no-console
  } else if (datum.type === 'error') {
    console.log(`Server ERROR : ${msg}`); // eslint-disable-line no-console
  } else if (datum.type === 'success') {
    console.log(`${msg}`); // eslint-disable-line no-console
  } else if (datum.type === 'verify') {
    console.log(`VERIFY : ${msg}`); // eslint-disable-line no-console
  }
};

export abstract class ConnectionManager {

  connection: DarkChatSocket | DarkChatSocketCreator
  host: string
  port: integer
  datumListeners: List<DatumListener>
  started: boolean

  constructor(connectionCreator: DarkChatSocketCreator, host: string, port: integer) {
    this.connection = connectionCreator
    this.host = host
    this.port = port
    this.datumListeners = List()
    this.started = false
  }

  abstract async registerCallbacks() : Promise<any>

  /**
     * Add a message listener callback function of the form
     * (jsonData) => { ... }
     * The ws library, and the isomorphic shim above for Browser Websocket,
     * listen on the event called `message`
     */
  addDatumListener(listener: (datum: JSONDatum) => void) { // eslint-disable-line no-unused-vars
    this.datumListeners = this.datumListeners.push(listener)
  }

  abstract send(jsonString: string): void; // eslint-disable-line no-unused-vars

  sendDatum({
    type, channelName = null, userName = null, fromPublicKey = null, msg = null, toPublicKey = null,
  }: {
    type: string,
    channelName?: string | null,
    userName?: string | null,
    fromPublicKey?: Secp256k1PublicKey | null,
    msg?: string | null,
    toPublicKey?: Secp256k1PublicKey | null,
  }): void {
    const jsonString = JSON.stringify({
      type,
      msg,
      uname: userName,
      fromPublicKey: fromPublicKey && fromPublicKey.toHexString(),
      toPublicKey: toPublicKey && toPublicKey.toHexString(),
      cname: channelName,
    })
    // console.log('sendDatum', jsonString) // eslint-disable-line no-console
    this.send(jsonString);
  }

  async start() {
    if (this.started) {
      throw new Error("Connection manager is already open. Don't share this between clients.")
    }

    this.started = true
    // Lazy evaluation of connection creator, so that we only create it right before
    // we register onopen listener
    if (typeof (this.connection) === 'function') {
      this.connection = this.connection()
    }
    await this.registerCallbacks()
  }

  /**
   * Close the connection, to allow the client to end non-interactively.
   * If connection requires special closing, do this in subclass.
   */
  abstract stop(): void

}