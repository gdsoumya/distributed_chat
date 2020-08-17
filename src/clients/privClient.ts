'use strict'

import { List, OrderedMap } from 'immutable'
import { Client } from './client'
import { Stage } from '../stages/stage'
import { assert } from 'chai'
import { Secp256k1PublicKey } from '../keys'
import { ConnectionManager, StageChangeListener, JSONDatum, StageCreator } from '../..'
import { ClientStateBuilder } from '../builder'
import { RequestChallengeStage, RequestChallengeStageCreator } from '../stages/register'

export class PrivateChannelClient extends Client {
	
  constructor(
    counterParty: Secp256k1PublicKey,
    connMan: ConnectionManager,
    stageChangeListeners: List<StageChangeListener>,

    ) {
    super(connMan,
      List([
        RequestChallengeStageCreator,
        (builder: ClientStateBuilder) => new PrivateMessageStage(counterParty, builder) ]),
      stageChangeListeners,
    )
  }

}


export class PrivateMessageStage extends Stage {

  readonly toPublicKey: Secp256k1PublicKey
  private messageQueue: List<JSONDatum>

  constructor(toPublicKey: Secp256k1PublicKey, builder: ClientStateBuilder) {
    super("privateMessage", builder)
    this.messageQueue = List([])
    this.toPublicKey = toPublicKey
  }

  sendServerCommand(connectionManager: ConnectionManager) {
    if (!this.messageQueue.isEmpty()) {
      const first: JSONDatum = this.messageQueue.first()
      connectionManager.sendDatum({
        type: 'msg',
        msg: first.msg,
        fromPublicKey: this.builder.getClientState().keyPair.getPublicKey(),
        toPublicKey: this.toPublicKey,        
      })
    }
  }

  enqueueUserDatum(message: JSONDatum) {
    this.messageQueue = this.messageQueue.push(message)
  }

  parseReplyToNextBuilder(dataJSON: JSONDatum) {
    if (dataJSON.type === 'success') {
      // go and send the next message in the queue
      this.messageQueue = this.messageQueue.remove(0)
      this.sendServerCommand(this.builder.getClientState().connectionManager)
    } else if (dataJSON.type === 'error') {
      console.log("failed to send a message")
    }
    // stay in this stage forever
    // TODO make a disconnect stage if we want to allow human users
    // to stop this client politely.
    return this.builder
  }

}