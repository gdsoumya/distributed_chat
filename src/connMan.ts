const readline = require('readline');
const secp256k1 = require('secp256k1');
const { randomBytes } = require('crypto');
const { TextEncoder } = require('text-encoder');

import { JSONDatum, DarkChatSocket, integer, DatumListener } from './types'
import { Secp256k1PublicKey } from './keys'

export const messageConsoleLogger = (_data: JSONDatum): void => {
  //const data = JSON.parse(_data.toString ? _data.toString() : _data);
  const data = JSON.parse(_data);
  // console.log('TYPE ' + data['type']);
  const msg = data['msg']['type'] === 'Buffer' ? Buffer.from(data['msg']).toString() : JSON.stringify(data['msg']);

  //console.log(_data);
  if (data.type === 'msg') {
    if (data['private']) console.log(`${data['uname']}:${data['pk']}:- ${msg}`);
    else console.log(`${data['uname']}:${data['cname']}- ${msg}`);
  }
  else if (data.type === 'error') {
    console.log(`ERROR : ${msg}`);
  }
  else if (data.type === 'success') {
    console.log(`${msg}`);
  }
  else if (data.type === 'verify') {
    console.log(`VERIFY : ${msg}`);
  }
};

export abstract class ConnectionManager {

  connection: DarkChatSocket
  host: string
  port: integer

  constructor(connection: DarkChatSocket, host: string, port: number) {
    this.connection = connection;
    this.host = host;
    this.port = port;
  }

  abstract addDatumListener(listener: DatumListener)

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

  on(eventName: string, cb: (data: any) => void): void {
    this.connection.on(eventName, cb);
  }

  /**
	 * Close the connection, to allow the client to end non-interactively.
	 */
  stop() {
    this.connection.close();
  }

};