'use strict'

import { ClientState, Client } from './client'
import { ConnectionManager } from './connMan'
import { Stage } from './stage'
import { StageChangeListeners } from './types'
import { RequestChallengeStage } from './register'
import { List } from 'immutable'
import { assert } from 'chai'

export class PublicChannelClient extends Client {

  constructor(channelName: string, userName: string, connMan: ConnectionManager, stageChangeListeners: List<StageChangeListeners>) {
    super(connMan, List([
      (clientState: ClientState) => new RequestChallengeStage(clientState),
      (clientState: ClientState) => new JoinChannelStage(channelName, userName, clientState),
      ]),
    )
  }


}

// Private classes for singletons

export class JoinChannelStage extends Stage {

  readonly channelName: string
  readonly userName: string

  constructor(channelName: string, userName: string, clientState: ClientState) {
    super("joinPublicChannel", clientState)
    this.channelName = channelName
    this.userName = userName
  }

  sendServerCommand(connectionManager: ConnectionManager) {
    connectionManager.sendJSON({
      type: 'join',
      userName: this.userName,
      channelName: this.channelName,
      fromPublicKey: this.clientState.keyPair.getPublicKey(),
    })
  }

  // We are unlikely to ever get here.
  // 
  enqueueUserDatum(datum: JSONDatum) {
    throw new Error("Join a channel first")
  }

  parseReplyToNextState(dataJSON) {
    if (dataJSON.type === 'success') {
      console.log("server success received")
      // We stay in this state indefinitely
      // TODO: allow enqueueUserDatum to send close command to server
      // and to handle here
      return this.clientState
    } else {
      console.error("Received unexpected message", JSON.stringify(dataJSON))
    }
  }

}

export class PublicMessageStage extends Stage {

  private messageQueue: List<JSONDatum>

  constructor(clientState: ClientState) {
    super("publicMessage", clientState)
    this.messageQueue = new List([])
  }

  sendServerCommand(connectionManager: ConnectionManager) {
    if (!this.messageQueue.isEmpty()) {
      connectionManager.sendJSON({
        type: 'msg',
        userName: this.userName,
        channelName: this.channelName,
        msg: this.messageQueue.first(),
        pubKey: this.publicKey,
      })
    }
  }

  enqueueDatum(datum: JSONDatum) {
    this.messageQueue = this.messageQueue.push(datum)
  }

  parseReplyToNextState(dataJSON: JSONDatum) {
    if (dataJSON.type === 'success') {
      // go and send the next message in the queue
      this.messageQueue = this.messageQueue.remove(0)
    } else if (dataJSON.type === 'error') {
      console.log("failed to send a message")
    }
    // stay in this stage forever
    // TODO make a disconnect stage if we want to allow human users
    // to stop this client politely.
    return stages.PUB_MESSAGE_STAGE
  }

}