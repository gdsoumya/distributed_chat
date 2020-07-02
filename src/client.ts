// A top-level client, which you can subclass to be a Bot, PublicChannel, PrivateMessage client.
'use strict'

import { List, Map } from 'immutable'
const secp256k1 = require('secp256k1')
const randombytes = require('randombytes')
const { assert } = require('chai')

import { ConnectionManager } from './connMan'
import { Stage } from './stage'
import { Secp256k1PrivateKey, Secp256k1PublicKey, Secp256k1Signature } from './types'

export class Client {

  messageListeners: List<(data: string) => void>
  stageChangeListeners: List<(oldStage: Stage, newStage: Stage) => void>
  stages: Map<string,Stage>;
  currentStage: Stage;
  connectionManager: ConnectionManager;
  privateKey: Secp256k1PrivateKey;
  publicKey: Secp256k1PublicKey;

  constructor(startStage: Stage, connectionManager: ConnectionManager) {
    this.messageListeners = List([])
    this.stageChangeListeners = List([])
    this.stages = new Map({})
    this.currentStage = startStage
    this.connectionManager = connectionManager
    // Register this client as the primary 'message' eventHandler for connection
    this.connectionManager.addMessageListener(this.getConnectionListener())

    while (true) { // eslint-disable-line no-constant-condition
      const privKey = randombytes(32);
      if (secp256k1.privateKeyVerify(privKey)) {
        this.privateKey = Secp256k1PrivateKey(privKey);
        break;
      }
    }
    this.publicKey = Secp256k1PublicKey(secp256k1.publicKeyCreate(this.privateKey)).toString('hex');

    assert(this.publicKey, 'No public key found')
  }

  genSignature(msg: string): Secp256k1Signature {
    msg = new TextEncoder().encode(msg);
    const sigObj = secp256k1.ecdsaSign(msg, this.privateKey);
    return Buffer.from(sigObj.signature).toString('hex');
  }

  /**
   * Kick off the first stage, and the request-response cycle,
   * after the connection is open.
   */
  start() {
    this.currentStage.start(this.connectionManager)
    this.connectionManager.on('open',
      () => {
        setTimeout(() => {
          console.log('Starting the first stage')
        }, 1000)
      })
  }

  enqueueMessage(message: DataJSON) {
    this.currentStage.enqueueMessage(message)
  }

  addStageChangeListener(listener: (oldStage: Stage, newStage: Stage) => void) {
    this.stageChangeListeners = this.stageChangeListeners.push(listener)
  }
     
  addMessageListener(listener: (data: string) => void) {
    this.messageListeners = this.messageListeners.push(listener)
  }

  // 
  getConnectionListener(): (dataString: string) => void {
    return (dataString) => {
      console.log('Inside the primary message listener')
      const dataJSON = JSON.parse(dataString)
      try {
        const newStage = this.currentStage.parseReplyToNextStage(dataJSON)
        this.stages = this.stages.set(newStage.name, newStage)
        this.stageChangeListeners.forEach((listener) => {
          listener(this.currentStage, newStage)
        })
        this.currentStage = newStage
      } catch(e) {
      }
    }
  }
     
}

// Chat string parser, for human console interface and non-interactive testing.
// Creates new public and private channels and returns them
// or sends generic raw JSON to server for direct protocol access
export const processLine = (line: string, connMan: ConnectionManager) => {
  const msg = line.split(' ')
  const type = msg[0].toLowerCase()
  if (type === 'connect') {
    const privClient = new PrivateChannelClient(msg[2], connMan)
    privClient.start()
    return privClient
  } else if (type === 'join') {
    const pubClient = new PublicChannelClient(msg[1], msg[2], connMan)
    pubClient.start()
    return pubClient
  } else {
    connMan.sendJSON({ ...msg })
  }
}