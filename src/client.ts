// A top-level client, which you can subclass to be a Bot, PublicChannel, PrivateMessage client.
'use strict'

import { List, Map } from 'immutable'
import secp256k1 from 'secp256k1'
const randombytes = require('randombytes')
import { assert } from 'chai'

import { ConnectionManager } from './connMan'
import { Stage } from './stage'
import { Secp256k1KeyPair, Secp256k1Signature } from './keys'
import { StageChangeListener, DatumListener, JSONDatum, StageCreator } from './types'

export class Client {

  datumListeners: List<DatumListener>
  stageChangeListeners: Map<string,StageChangeListener>
  initialStageList: OrderedMap<string,Stage>
  currentStage: Stage;
  connectionManager: ConnectionManager
  keyPair: Secp256k1KeyPair

  constructor(initialStageCreators: List<StageCreator>, connectionManager: ConnectionManager) {
    this.datumListeners = List([])
    this.stageChangeListeners = Map({})

    if (initialStageCreators.size() == 0) {
      throw new Error('Clients must have at least one initial stage to start.')
    }
    this.initialStageList = initialStageList
    this.currentStage = initialStageList.first()

    this.connectionManager = connectionManager
    // Register this client as the primary 'message' eventHandler for connection
    this.connectionManager.addDatumListener(this.getDataStringListener())

    this.keyPair = new Secp256k1KeyPair()    
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

  enqueueDatum(datum: JSONDatum) {
    this.currentStage.enqueueDatum(datum)
  }

  addStageChangeListener(newStageName: string, listener: StageChangeListener) {
    this.stageChangeListeners = this.stageChangeListeners.push(listener)
  }
     
  addDatumListener(listener: DatumListener) {
    this.datumListeners = this.datumListeners.push(listener)
  }

  // 
  getDataStringListener(): (dataString: string) => void {
    return (dataString) => {
      console.log('Inside the primary message listener')
      const datum : JSONDatum = JSON.parse(dataString)
      try {
        const newStage = this.currentStage.parseReplyToNextStage(datum, this)
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