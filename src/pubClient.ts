'use strict'

const { Client } = require('./client')
const { Stage } = require('./stage')
const { List } = require('immutable')
const { assert } = require('chai')

const pubClients = {}

pubClients.PublicChannelClient = class extends Client {
	
  constructor(channelName, userName, connMan) {
    super(new JoinStage(channelName, userName), connMan)
    // TODO: Kludge!
    // Attach the publicKey of this client to the first stage
    this.currentStage.publicKey = this.publicKey
    this.joinStage = this.currentStage
    this.messageStage = new PublicMessageStage(this.publicKey)
  }

}

// Private classes for singletons

const JoinStage = class extends Stage {

  constructor(channelName, userName, parent) {
    super("Join Public Channel")
    this.channelName = channelName
    this.userName = userName
    this.parent = parent
  }

  sendServerCommand(connectionManager) {
    assert(this.publicKey)
    connectionManager.sendJSON({
      type: 'join',
      userName: this.userName,
      channelName: this.channelName,
      pubKey: this.publicKey,
    })
  }

  // We are unlikely to ever get here.
  // 
  enqueueMessage(message) {
    throw new Error("Join a channel first")
  }

  parseReplyToNextStage(dataJSON) {
    if (dataJSON.type === 'success') {
      console.log("server success received")
      return this.messageStage
    } else {
      console.error("Received unexpected message", JSON.stringify(dataJSON))
    }
  }

}

const PublicMessageStage = class extends Stage {

  constructor(publicKey) {
    super("Message Public Channel")
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

  parseReplyToNextStage(dataJSON) {
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