/* eslint-disable max-classes-per-file */

import { List } from 'immutable'
import { Client } from './client'
import { Stage } from '../stages/stage'
import { Secp256k1PublicKey, Secp256k1KeyPair, Secp256k1PrivateKey } from '../keys'
import { ConnectionManager, JSONDatum, integer } from '../..'
import { ClientStateBuilder } from '../builder'
import { RequestChallengeStageCreator } from '../stages/register'
import { encryptJSON, decryptHexString } from '../clientUtils'

export class PrivateMessageStage extends Stage {

  readonly toPublicKey: Secp256k1PublicKey
  private sharedKey: Secp256k1PrivateKey | (() => Secp256k1PrivateKey)

  constructor(toPublicKey: Secp256k1PublicKey, builder: ClientStateBuilder) {
    super('privateMessage', builder)
    this.toPublicKey = toPublicKey
    this.sharedKey = () => this.builder.getClientState().keyPair.getSharedKey(this.toPublicKey)
  }

  getSharedKey() {
    if (typeof this.sharedKey === 'function') {
      this.sharedKey = this.sharedKey()
    }
    return this.sharedKey
  }

  sendServerCommand(connectionManager: ConnectionManager) {
    if (!this.builder.client.isMessageQueueEmpty()) {
      const first: JSONDatum = this.builder.client.getFirstMessage()
      const sharedKey = this.getSharedKey()
      connectionManager.sendDatum({
        type: 'msg',
        msg: encryptJSON(first, sharedKey.bufferValue),
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
    const sharedKey = this.getSharedKey()
    const decryptedJSON = (dataJSON.msg === 'MESSAGE SENT') ? dataJSON : JSON.parse(decryptHexString(dataJSON.msg || '', sharedKey.bufferValue))
    // stay in this stage forever
    // TODO make a disconnect stage if we want to allow human users
    // to stop this client politely.
    const { currentStageCreator } = this.builder
    return this.builder.toNextBuilder(decryptedJSON, currentStageCreator)
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

  triggerQueueProcessing() {
    console.log(`Message queue ${this.messageQueue.count()} flush limit ${this.flushLimit}`)
    const stage = this.builder.getStage()
    if (stage instanceof PrivateMessageStage) {
      if ((this.messageQueue.count() >= this.flushLimit)
        && (this.sentCount >= this.ackedCount)) {
        // If we've reached the flush limit and are not already in the middle of sending,
        // kick off another round
        stage.sendServerCommand(this.builder.getClientState().connectionManager)
      }
    }
  }

}
