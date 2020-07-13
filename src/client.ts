// A top-level client, which you can subclass to be a Bot, PublicChannel, PrivateMessage client.
'use strict'

import { List, Map } from 'immutable'
import secp256k1 from 'secp256k1'
const randombytes = require('randombytes')
import { assert } from 'chai'

import { ConnectionManager } from './connMan'
import { Stage } from './stage'
import { Secp256k1KeyPair, Secp256k1Signature, Secp256k1PublicKey } from './keys'
import { StageChangeListener, DatumListener, JSONDatum, StageCreator } from './types'

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
  readonly currentStage: Stage
  readonly stageHistory: List<Stage>
  readonly remainingStageCreators: List<StageCreator>
  readonly remainingStageChangeListeners: List<StageChangeListener>

  constructor(
    keyPair: Secp256k1KeyPair,
    connectionManager: ConnectionManager,
    currentStage: Stage,
    stageHistory: List<Stage>,
    remainingStageCreators: List<StageCreator>,
    remainingStageChangeListeners: List<StageChangeListener>,
    ) {
    this.keyPair = keyPair
    this.connectionManager = connectionManager
    this.currentStage = currentStage
    this.stageHistory = stageHistory
    this.remainingStageCreators = remainingStageCreators
    this.remainingStageChangeListeners = remainingStageChangeListeners
  }

  /**
   * Create a new client state from this one, advancing to a new stage, pushing it onto history
   * and accepting a possibly updated list of remaining stage creators.
   */
  static fromPreviousState(previousState: ClientState, newStageCreator: StageCreator) {
    return new ClientState(
      previousState.keyPair,
      previousState.connectionManager,
      newStage,
      previousState.stageHistory.push(previousState.currentStage),
      previousState.remainingStageCreators,
      previousState.remainingStageChangeListeners.remove(0),
      )
  }

  static fromNextStageCreator(previousState: ClientState) {
    return new ClientState(
      previousState.keyPair,
      previousState.connectionManager,
      previousState.remainingStageCreators.first<StageCreator>()(previousState),
      previousState.stageHistory.push(previousState.currentStage),
      previousState.remainingStageCreators.remove(0),
      previousState.remainingStageChangeListeners.remove(0),      
    )
  }

}

export class Client {

  readonly connectionManager: ConnectionManager
  private clientState: ClientState

  constructor(connectionManager: ConnectionManager,
    initialStageCreators: List<StageCreator>, 
    stageChangeListeners: List<StageChangeListener>,
    ) {

    this.connectionManager = connectionManager

    if (initialStageCreators.size == 0) {
      throw new Error('Clients must have at least one initial stage creator to start.')
    }
    const firstStage = initialStageCreators.first<StageCreator>()(this)

    // Register this client as the primary 'message' eventHandler for connection
    connectionManager.addDatumListener(this.getConnectionListener())

    this.clientState = new ClientState(
      new Secp256k1KeyPair(), // TODO In the future, we may wish to allow an existing private key
      connectionManager,
      firstStage,
      List(),
      initialStageCreators.remove(0),
      stageChangeListeners,
      )
  }
  
  /**
   * Kick off the first stage, and the request-response cycle,
   * after the connection is open.
   */
  start() {
    this.clientState.currentStage.start(this.connectionManager)
    this.connectionManager.on('open',
      () => {
        setTimeout(() => {
          console.log('Starting the first stage')
        }, 1000)
      })
  }

  enqueueUserDatum(datum: JSONDatum) {
    this.clientState.currentStage.enqueueUserDatum(datum)
  }

  getConnectionListener() {
    return (datum: JSONDatum) => {
      console.log('Inside the primary message listener')
      try {
        const newState = this.clientState.currentStage.parseReplyToNextState(newDatum)
        // Update the old state's stage change listeners
        this.clientState.remainingStageChangeListeners.forEach((listener) => {
          listener(this.clientState.currentStage, newState.currentStage)
        })
        this.clientState = newState
        

      } catch(e) {
      }
    }
  }

}