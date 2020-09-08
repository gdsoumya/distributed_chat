// A top-level client, which you can subclass to be a Bot, PublicChannel, PrivateMessage client.
/* eslint-disable max-classes-per-file */
import { List } from 'immutable'

import { assert } from 'chai'
import { ConnectionManager } from '../connmans/connMan'
import { Secp256k1KeyPair, Secp256k1PublicKey } from '../keys'
import {
  DatumListener, JSONDatum, StageCreator, integer, StageChangeListener, StageChangeListenerId,
} from '../types'
import { ClientStateBuilder } from '../builder'
import { Stage } from '../stages/stage'

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
  protected preStageListenerMap: Map<string, List<StageChangeListener>>
  protected postStageListenerMap: Map<string, List<StageChangeListener>>

  constructor(
    connectionManager: ConnectionManager,
    initialStageCreators: List<StageCreator>,
    flushLimit: integer = Client.FLUSH_LIMIT,
    keyPair?: Secp256k1KeyPair,
  ) {

    this.connectionManager = connectionManager
    this.messageQueue = List<JSONDatum>()
    this.flushLimit = flushLimit

    this.preStageListenerMap = new Map()
    this.postStageListenerMap = new Map()

    if (initialStageCreators.size === 0) {
      throw new Error('Clients must have at least one initial stage creator to start.')
    }

    // Register this client as the primary 'message' eventHandler for connection
    connectionManager.addDatumListener(this.getConnectionListener())

    this.builder = new ClientStateBuilder(
      keyPair || new Secp256k1KeyPair(),
      connectionManager,
      initialStageCreators.remove(0),
      initialStageCreators.first(),
      this,
    )
  }

  getBuilder(): ClientStateBuilder {
    return this.builder
  }

  // Register the current listener
  addStageListener(
    preStageName: string,
    postStageName: string,
    listener: StageChangeListener,
  ): StageChangeListenerId {

    const preListeners = this.preStageListenerMap.get(preStageName) || List()
    this.preStageListenerMap = this.preStageListenerMap.set(
      preStageName, preListeners.push(listener),
    )
    const postListeners = this.postStageListenerMap.get(postStageName) || List()
    this.postStageListenerMap = this.postStageListenerMap.set(
      postStageName, postListeners.push(listener),
    )

    return new StageChangeListenerId(
      preStageName,
      preListeners.count() as integer,
      postStageName,
      postListeners.count() as integer,
    )
  }

  getListenerFromId(listenerId: StageChangeListenerId): StageChangeListener {
    const preListeners = this.preStageListenerMap.get(listenerId.preStageName)
    const postListeners = this.postStageListenerMap.get(listenerId.postStageName)
    const preListener = preListeners?.get(listenerId.preStageCount)
    const postListener = postListeners?.get(listenerId.postStageCount)
    if ((preListener === undefined) || (postListener === undefined)) {
      throw new Error(`No listener found for ID ${listenerId.toString()}`)
    }
    return preListener
  }

  addListenerWrapPromise(
    preStageName: string,
    postStageName: string,
    listener: StageChangeListener,
  ) {
    return new Promise((resolve, reject) => {
      const wrappedListener = (preStage: Stage, postStage: Stage, userDatum: JSONDatum) => {
        try {
          const result = listener(preStage, postStage, userDatum)
          resolve(result)
        } catch (e) {
          reject(e)
        }
      }
      this.addStageListener(preStageName, postStageName, wrappedListener)
      return wrappedListener
    })
  }

  removeStageListener(listenerId: StageChangeListenerId) {
    const preListeners = this.preStageListenerMap.get(listenerId.preStageName) || List()
    this.preStageListenerMap = this.preStageListenerMap.set(
      listenerId.preStageName,
      preListeners.remove(listenerId.preStageCount),
    );

    const postListeners = this.postStageListenerMap.get(listenerId.postStageName) || List()
    this.postStageListenerMap = this.postStageListenerMap.set(
      listenerId.postStageName,
      postListeners.remove(listenerId.postStageCount),
    );
  }

  getFirstMessage(): JSONDatum {
    if (!this.messageQueue.isEmpty()) {
      return this.messageQueue.first()
    }
    return { type: 'empty', fromPublicKey: this.builder.getClientState().keyPair.getPublicKey().toHexString() }

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
    // this.triggerQueueProcessing()
  }

  enqueueMessage(msg: string) {
    this.enqueueUserDatum({
      type: 'msg',
      msg,
      fromPublicKey: this.builder.getClientState().keyPair.getPublicKey().toHexString(),
    })
  }

  getConnectionListener(): DatumListener {
    return (datum: JSONDatum) => {
      try {
        const newBuilder = this.builder.getStage().parseReplyToNextBuilder(datum)

        // fire off any listeners
        const preStage = this.builder.getStage()
        const postStage = newBuilder.getStage()
        const preListeners = this.preStageListenerMap.get(preStage.stageName) || List()
        const postListeners = this.postStageListenerMap.get(postStage.stageName) || List()
        const listeners = preListeners.filter((filter) => postListeners.includes(filter))
        listeners.forEach((listener) => listener(preStage, postStage, datum))

        this.builder = newBuilder
        // Immediately start the new stage
        this.builder.startStage()

      } catch (e) {
        console.error('Client Message Listener ERROR: ', JSON.stringify(e.toString())) // eslint-disable-line no-console
      }
    }
  }

}