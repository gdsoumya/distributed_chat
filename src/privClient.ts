<<<<<<< HEAD

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
=======
'use strict'

const { Client } = require('./client')
const { Stage } = require('./stage')
const { List } = require('immutable')
const { assert } = require('chai')

const privClients = {}

privClients.PrivateChannelClient = class extends Client {
	
  constructor(channelName, userName, connMan) {
    super(new ConnectStage(), connMan)
    this.connectStage = this.currentStage
  }

}

// Private classes for singletons

const ConnectStage = class extends Stage {

  constructor() {
    super("connect")
    this.channelName = channelName
    this.userName = userName
  }

  sendServerCommand(connectionManager) {
    assert(this.publicKey)
    connectionManager.sendJSON({
      type: 'connect',
      pubKey: this.publicKey,
    })
  }

  // We are unlikely to ever get here.
  // 
  enqueueMessage(message) {
    throw new Error("Finish connecting before sending messages")
  }

  parseReplyToNextStage(dataJSON, parent) {
    if (dataJSON.type === 'verify') {
      const challengeSig = parent.genSignature(challenge)
      console.log("server success received, challengeSig ", challengeSig)
      return new SignStage(challengeSig, parent.getPublicKey())
    } else {
      console.error("Received unexpected message", JSON.stringify(dataJSON))
    }
>>>>>>> 5af31d6be5216aab8d3575c25c40e597614a1a62
  }

}

<<<<<<< HEAD
=======
const SignStage = class extends Stage {

  constructor(challengeSig, publicKey) {
    super("sign")
    this.challengeSig = challengeSig
    this.publicKey = publicKey
  }

  sendServerCommand(connectionManager) {
    connectManager.sendJSON({
      type: 'verify',
      pubKey: this.publicKey,
      msg: challengeSig,
    })
  }

}
>>>>>>> 5af31d6be5216aab8d3575c25c40e597614a1a62

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