const readline = require('readline');
const secp256k1 = require('secp256k1');
const { randomBytes } = require('crypto');
const { TextEncoder } = require('text-encoder');

import { DataJSON, Secp256k1PublicKey } from './types'

export const messageConsoleLogger = (_data: DataJSON): void => {
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

  connection: Socket
  host: string
  port: number

  constructor(connection: Socket, host: string, port: number) {
    this.connection = connection;
    this.host = host;
    this.port = port;
  }

  abstract addMessageListener(listener: (msg: DataJSON) => void)

  sendJSON({ type, channelName, userName, pubKey='', msg = '', dm = ''}: { 
    type: string,
    channelName: string,
    userName: string,
    pubKey: Secp256k1PublicKey,
    msg: string,
    dm: string,
  } ): void {
    const jsonString = JSON.stringify({
      type: type,
      msg: msg,
      uname: userName,
      pk: pubKey,
      private: dm,
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