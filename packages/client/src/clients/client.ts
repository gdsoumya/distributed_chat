// A top-level client, which you can subclass to be a Bot, PublicChannel, PrivateMessage client.
/* eslint-disable max-classes-per-file */
import { List, Map } from 'immutable'

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
  readonly lastUserDatum: JSONDatum
  readonly builder: ClientStateBuilder

  constructor(
    keyPair: Secp256k1KeyPair,
    connectionManager: ConnectionManager,
    remainingStageCreators: List<StageCreator>,
    lastUserDatum: JSONDatum,
    builder: ClientStateBuilder,
  ) {
    this.keyPair = keyPair
    this.connectionManager = connectionManager
    this.remainingStageCreators = remainingStageCreators
    this.lastUserDatum = lastUserDatum
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
  protected preStageListenerMap: Map<string, Map<integer, StageChangeListener | null>>
  protected postStageListenerMap: Map<string, Map<integer, StageChangeListener | null>>
  protected sentCount: integer
  protected ackedCount: integer

  constructor(
    connectionManager: ConnectionManager,
    initialStageCreators: List<StageCreator>,
    flushLimit: integer = Client.FLUSH_LIMIT,
    keyPair?: Secp256k1KeyPair,
  ) {

    this.connectionManager = connectionManager
    this.messageQueue = List<JSONDatum>()
    this.flushLimit = flushLimit

    this.preStageListenerMap = Map()
    this.postStageListenerMap = Map()

    this.sentCount = 0 as integer
    this.ackedCount = 0 as integer

    if (initialStageCreators.size === 0) {
      throw new Error('Clients must have at least one initial stage creator to start.')
    }

    // Register this client as the primary 'message' eventHandler for connection
    connectionManager.addDatumListener(this.getConnectionListener())

    const initialKeyPair = keyPair || new Secp256k1KeyPair()

    this.builder = new ClientStateBuilder(
      initialKeyPair,
      connectionManager,
      initialStageCreators.remove(0),
      initialStageCreators.first(),
      { type: 'initial', fromPublicKey: initialKeyPair.getPublicKey().toHexString() },
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

    const preListeners = this.preStageListenerMap.get(preStageName) || Map()
    this.preStageListenerMap = this.preStageListenerMap.set(
      preStageName, preListeners.set(preListeners.count() as integer, listener),
    )
    const postListeners = this.postStageListenerMap.get(postStageName) || Map()
    this.postStageListenerMap = this.postStageListenerMap.set(
      postStageName, postListeners.set(postListeners.count() as integer, listener),
    )

    return new StageChangeListenerId(
      preStageName,
      preListeners.count() as integer,
      postStageName,
      postListeners.count() as integer,
    )
  }

  getListenerFromId(listenerId: StageChangeListenerId): StageChangeListener | null {
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
    let listenerId : StageChangeListenerId
    return new Promise((resolve, reject) => {
      const wrappedListener = (preStage: Stage, postStage: Stage, userDatum: JSONDatum) => {
        try {
          const result = listener(preStage, postStage, userDatum)
          // Remove any listener after we have resolved it once
          this.removeStageListener(listenerId)
          console.log('Removed listener ', listenerId.toString())
          resolve(result)
        } catch (e) {
          reject(e)
        }
      }
      listenerId = this.addStageListener(preStageName, postStageName, wrappedListener)
    })
  }

  removeStageListener(listenerId: StageChangeListenerId) {
    const preListeners = this.preStageListenerMap.get(listenerId.preStageName) || Map()
    this.preStageListenerMap = this.preStageListenerMap.set(
      listenerId.preStageName,
      preListeners.set(listenerId.preStageCount as integer, null),
    );

    const postListeners = this.postStageListenerMap.get(listenerId.postStageName) || Map()
    this.postStageListenerMap = this.postStageListenerMap.set(
      listenerId.postStageName,
      postListeners.set(listenerId.postStageCount as integer, null),
    );

    assert(this.getListenerFromId(listenerId) === null,
      `Removed listener ${listenerId.toString()} still exists`)
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

  abstract triggerQueueProcessing(): void

  enqueueUserDatum(datum: JSONDatum) {
    this.messageQueue = this.messageQueue.push(datum)
    this.sentCount = (this.sentCount + 1) as integer
    this.triggerQueueProcessing()
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
        /*
        if (datum.type === 'success' && datum.msg === 'MESSAGE SENT') {
          this.ackedCount = (this.ackedCount + 1) as integer
        } else {
          */
        {
          const newBuilder = this.builder.getStage().parseReplyToNextBuilder(datum)
          const { lastUserDatum } = newBuilder.getClientState()

          // fire off any listeners
          const preStage = this.builder.getStage()
          const postStage = newBuilder.getStage()
          const preListeners = this.preStageListenerMap.get(preStage.stageName) || Map()
          const postListeners = this.postStageListenerMap.get(postStage.stageName) || Map()
          const listeners = preListeners.filter(
            /* eslint-disable max-len */
            (filter: StageChangeListener | null) => (filter !== null) && postListeners.includes(filter),
            /* eslint-enable max-len */
          )
          listeners.forEach((listener, index) => {
            if (listener) {
              console.log('Listeners index', index, preStage.stageName, postStage.stageName)
              listener(preStage, postStage, lastUserDatum)
            }
          })

          this.builder = newBuilder
        }
        // Immediately start the new stage
        this.builder.startStage()

      } catch (e) {
        /* eslint-disable-line no-console */
        console.error('Client Message Listener ERROR: ', JSON.stringify(e.toString()))
        console.error(e.stack)
        /* eslint-enable-line no-console */
      }
    }
  }

}