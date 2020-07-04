
'use strict'

import { List, OrderedMap } from 'immutable'
import { Secp256k1PublicKey } from './types'
import { Client } from './client'
import { Stage } from './stage'
import { assert } from 'chai'

export class PrivateChannelClient extends Client {
	
  constructor(
    counterParty: Secp256k1Public,
    connMan: ConnectionManager
    ) {
    super(connMan,
      new OrderedMap([
        ['connect', ConnectStage ],
        ['privateMessage', PrivateMessageStage]
        ]))
  }

}


const PrivateMessageStage = class extends Stage {

  constructor(publicKey) {
    super("privateMessage")
    this.messageQueue = new List([])
    this.publicKey = publicKey
  }

  sendServerCommand(connectionManager) {
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

  enqueueMessage(message) {
    this.messageQueue = this.messageQueue.push(message)
  }

  parseReplyToNextStage(dataJSON, parent) {
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

module.exports = pubClients