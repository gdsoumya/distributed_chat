/* eslint-disable max-classes-per-file */

import { List } from 'immutable'
import { Client } from './client'
import { ConnectionManager } from '../connmans/connMan'
import { Stage } from '../stages/stage'
import { JSONDatum, integer } from '../types'
import { RequestChallengeStageCreator } from '../stages/register'
import { ClientStateBuilder } from '../builder'
import { Secp256k1KeyPair } from '../keys'

export class PublicMessageStage extends Stage {

  readonly channelName: string
  readonly userName: string
  private sentCount: number
  private ackedCount: number

  constructor(channelName: string, userName: string, builder: ClientStateBuilder) {
    super('publicMessage', builder)
    this.channelName = channelName
    this.userName = userName
    this.sentCount = 0
    this.ackedCount = 0
  }

  getSentCount() {
    return this.sentCount
  }

  getAckedCount() {
    return this.ackedCount
  }

  sendServerCommand(connectionManager: ConnectionManager) {
    if (!this.builder.client.isMessageQueueEmpty()) {
      const datum: JSONDatum = this.builder.client.getFirstMessage()
      connectionManager.sendDatum({
        type: 'msg',
        userName: this.userName,
        channelName: this.channelName,
        msg: datum.msg,
        fromPublicKey: this.builder.getClientState().keyPair.getPublicKey(),
      })
      this.sentCount += 1
    }
    // TODO: Sometimes we may wish to post anonymously to a public channel
  }

  parseReplyToNextBuilder(dataJSON: JSONDatum) {
    if (dataJSON.type === 'success') {
      this.ackedCount += 1

      // if we've reached here, we've successfully sent the message
      // that was first in sendServerCommand
      this.builder.client.popFirstMessage()

      // keep emptying the queue
      this.sendServerCommand(this.builder.getClientState().connectionManager)
    } else if (dataJSON.type === 'error') {
      console.log('failed to send a message') // eslint-disable-line no-console
    }
    // stay in this stage forever
    // TODO make a disconnect stage if we want to allow human users
    // to stop this client politely.
    return this.builder
  }

}

export class JoinChannelStage extends Stage {

  readonly channelName: string
  readonly userName: string

  constructor(channelName: string, userName: string, builder: ClientStateBuilder) {
    super('joinPublicChannel', builder)
    this.channelName = channelName
    this.userName = userName
  }

  sendServerCommand(connectionManager: ConnectionManager) {
    connectionManager.sendDatum({
      type: 'join',
      userName: this.userName,
      channelName: this.channelName,
      fromPublicKey: this.builder.getClientState().keyPair.getPublicKey(),
    })
  }

  parseReplyToNextBuilder(dataJSON: JSONDatum) {
    if (dataJSON.type === 'success') {
      console.log('server success received') // eslint-disable-line no-console
      // We stay in this state indefinitely
      // TODO: allow enqueueUserDatum to send close command to server
      // and to handle here

      /* eslint-disable max-len */
      return this.builder.toNextBuilder(
        (builder: ClientStateBuilder) => new PublicMessageStage(this.channelName, this.userName, builder),
      )
      /* eslint-enable max-len */
    }
    console.error('Received unexpected message', JSON.stringify(dataJSON)) // eslint-disable-line no-console
    return this.builder;

  }

}

export class PublicChannelClient extends Client {

  constructor(
    channelName: string,
    userName: string,
    connMan: ConnectionManager,
    flushLimit?: integer,
    keyPair?: Secp256k1KeyPair,
  ) {
    super(
      connMan,
      List([
        RequestChallengeStageCreator,
        (builder: ClientStateBuilder) => new JoinChannelStage(channelName, userName, builder),
        (builder: ClientStateBuilder) => new PublicMessageStage(channelName, userName, builder),
      ]),
      flushLimit,
      keyPair,
    )
  }

  triggerQueueProcessing() {
    const stage = this.builder.getStage()
    if (stage instanceof PublicMessageStage) {
      if ((this.messageQueue.count() >= this.flushLimit)
        && (stage.getSentCount() === stage.getAckedCount())) {
        // If we've reached the flush limit and are not already in the middle of sending,
        // kick off another round
        stage.sendServerCommand(this.builder.getClientState().connectionManager)
      }
    }
  }

}

export default PublicChannelClient