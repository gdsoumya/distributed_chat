import readline from 'readline'
import secp256k1 from 'secp256k1'
const { TextEncoder } = require('text-encoder')
import { List } from 'immutable'

import { JSONDatum, DarkChatSocket, integer, DatumListener } from './types'
import { Secp256k1PublicKey } from './keys'

export const messageConsoleLogger = (datum: JSONDatum): void => {
  const msg = datum['msg']['type'] === 'Buffer' ? Buffer.from(datum['msg']).toString() : JSON.stringify(datum['msg']);

  //console.log(_datum);
  if (datum.type === 'msg') {
    if (datum['private']) console.log(`${datum['uname']}:${datum['pk']}:- ${msg}`);
    else console.log(`${datum['uname']}:${datum['cname']}- ${msg}`);
  }
  else if (datum.type === 'error') {
    console.log(`ERROR : ${msg}`);
  }
  else if (datum.type === 'success') {
    console.log(`${msg}`);
  }
  else if (datum.type === 'verify') {
    console.log(`VERIFY : ${msg}`);
  }
};

export abstract class ConnectionManager {

  connection: DarkChatSocket
  host: string
  port: integer
  datumListeners: List<DatumListener>

  constructor(connection: DarkChatSocket, host: string, port: integer) {
    this.connection = connection
    this.host = host
    this.port = port
    this.datumListeners = List()
    this.on('message', (dataString: string) => {
      const datum: JSONDatum = JSON.parse(dataString)
      this.datumListeners.forEach((listener) => listener(datum))
    });
  }

  /**
     * Add a message listener callback function of the form
     * (jsonData) => { ... }
     * The ws library, and the isomorphic shim above for Browser Websocket,
     * listen on the event called `message`
     */
  addDatumListener(listener: (datum: JSONDatum) => void) {
    this.datumListeners = this.datumListeners.push(listener)
  }

  sendDatum({ type, channelName, userName, fromPublicKey=null, msg = '', toPublicKey=null}: { 
    type: string,
    channelName: string,
    userName: string,
    fromPublicKey: Secp256k1PublicKey | null,
    msg: string,
    toPublicKey: Secp256k1PublicKey | null,
  } ): void {
    const jsonString = JSON.stringify({
      type,
      msg,
      uname: userName,
      fromPublicKey,
      toPublicKey,
      cname: channelName,
    })
    console.log(jsonString)

    this.connection.write(jsonString);
  }

  /**
	 * Close the connection, to allow the client to end non-interactively.
	 */
  stop() {
    this.connection.close();
  }

};