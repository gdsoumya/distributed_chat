/* eslint-disable max-classes-per-file */

import { List } from 'immutable'
import { Client } from './client'
import { Stage } from '../stages/stage'
import { Secp256k1PublicKey, Secp256k1KeyPair } from '../keys'
import { ConnectionManager, JSONDatum, integer } from '../..'
import { ClientStateBuilder } from '../builder'
import { RequestChallengeStageCreator } from '../stages/register'

export class PrivateMessageStage extends Stage {

  readonly toPublicKey: Secp256k1PublicKey

  constructor(toPublicKey: Secp256k1PublicKey, builder: ClientStateBuilder) {
    super('privateMessage', builder)
    this.toPublicKey = toPublicKey
  }

  sendServerCommand(connectionManager: ConnectionManager) {
    if (!this.builder.client.isMessageQueueEmpty()) {
      const first: JSONDatum = this.builder.client.getFirstMessage()
      connectionManager.sendDatum({
        type: 'msg',
        msg: first.msg,
        fromPublicKey: this.builder.getClientState().keyPair.getPublicKey(),
        toPublicKey: this.toPublicKey,
      })
    }
  }

  parseReplyToNextBuilder(dataJSON: JSONDatum) {
    if (dataJSON.type === 'success' || dataJSON.type === 'msg') {
      // go and send the next message in the queue
      this.builder.client.popFirstMessage()
      this.sendServerCommand(this.builder.getClientState().connectionManager)
    } else if (dataJSON.type === 'error') {
      console.error('failed to send a message') // eslint-disable-line no-console
    }
    // stay in this stage forever
    // TODO make a disconnect stage if we want to allow human users
    // to stop this client politely.
    return this.builder
  }

}
export class PrivateChannelClient extends Client {

  constructor(
    counterParty: Secp256k1PublicKey,
    connMan: ConnectionManager,
    flushLimit?: integer,
    keyPair?: Secp256k1KeyPair,
  ) {
    super(
      connMan,
      List([
        RequestChallengeStageCreator,
        (builder: ClientStateBuilder) => new PrivateMessageStage(counterParty, builder),
      ]),
      flushLimit,
      keyPair,
    )
  }

}
