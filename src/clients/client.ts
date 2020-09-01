// A top-level client, which you can subclass to be a Bot, PublicChannel, PrivateMessage client.
'use strict'

import { List, Map } from 'immutable'
import secp256k1 from 'secp256k1'
const randombytes = require('randombytes')
import { assert } from 'chai'

import { ConnectionManager } from '../connmans/connMan'
import { Stage } from '../stages/stage'
import { Secp256k1KeyPair, Secp256k1Signature, Secp256k1PublicKey } from '../keys'
import { StageChangeListener, DatumListener, JSONDatum, StageCreator, integer } from '../types'
import { ClientStateBuilder } from '../builder'

export interface ClientView {
  getPublicKey: () => Secp256k1PublicKey
}

/**
 * Immutable client state that is passed between stages and
 * updated by advanceNextStage
 */
export class ClientState {

  readonly keyPair: Secp256k1KeyPair
  readonly connectionManager: ConnectionManager
  readonly remainingStageCreators: List<StageCreator>
  readonly builder: ClientStateBuilder

  constructor(
    keyPair: Secp256k1KeyPair,
    connectionManager: ConnectionManager,
    remainingStageCreators: List<StageCreator>,
    builder: ClientStateBuilder,
    ) {
    this.keyPair = keyPair
    this.connectionManager = connectionManager
    this.remainingStageCreators = remainingStageCreators
    this.builder = builder
  }

  getStage() {
    return this.builder.getStage()
  }

}

export abstract class Client {

  static FLUSH_LIMIT: integer = 10 as integer

  readonly flushLimit: integer
  readonly connectionManager: ConnectionManager
  protected builder: ClientStateBuilder
  protected messageQueue: List<JSONDatum>

  constructor(
    connectionManager: ConnectionManager,
    initialStageCreators: List<StageCreator>, 
    flushLimit: integer = Client.FLUSH_LIMIT,
    ) {

    this.connectionManager = connectionManager
    this.messageQueue = List<JSONDatum>()
    this.flushLimit = flushLimit

    if (initialStageCreators.size == 0) {
      throw new Error('Clients must have at least one initial stage creator to start.')
    }

    // Register this client as the primary 'message' eventHandler for connection
    connectionManager.addDatumListener(this.getConnectionListener())

    this.builder = new ClientStateBuilder(
      new Secp256k1KeyPair(), // TODO In the future, we may wish to allow an existing private key
      connectionManager,
      initialStageCreators.remove(0),
      initialStageCreators.first(),
      this,
    )
  }

  getFirstMessage(): JSONDatum {
    if (!this.messageQueue.isEmpty()) {
      return this.messageQueue.first()
    } else {
      return { type: 'empty', fromPublicKey: this.builder.getClientState().keyPair.getPublicKey().toHexString() }
    }
  }

  popFirstMessage() {
    this.messageQueue = this.messageQueue.remove(0)
  }

  isMessageQueueEmpty() {
    return this.messageQueue.isEmpty()
  }
  
  /**
   * Kick off the first stage, and the request-response cycle,
   * after the connection is open.
   */
  async start() {
    // wait until connection manager is ready
    await this.connectionManager.start()
    this.builder.startStage()
    /*
    this.connectionManager.on('open',
      () => {
        setTimeout(() => {
          console.log('Starting the first stage')
        }, 1000)
      })
      */
  }

  protected enqueueUserDatum(datum: JSONDatum) {
    this.messageQueue = this.messageQueue.push(datum)
    //this.triggerQueueProcessing()
  }

  enqueueMessage(msg: string) {
    this.enqueueUserDatum({
      type: 'msg',
      msg: msg,
      fromPublicKey: this.builder.getClientState().keyPair.getPublicKey().toHexString(),
    })
  }

  getConnectionListener(): DatumListener {
    return (datum: JSONDatum) => {
      try {
        const newBuilder = this.builder.getStage().parseReplyToNextBuilder(datum)
        this.builder = newBuilder
        // Immediately start the new stage
        this.builder.startStage()

      } catch(e) {
        console.error('ERROR: ', JSON.stringify(e.toString()))
      }
    }
  }

}