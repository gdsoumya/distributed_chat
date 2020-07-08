// Common stages for registering a client
'use strict'

import { Stage } from './stage'
import { Client } from './client'
import { ConnectionManager } from './connMan'
import { Secp256k1PublicKey, Secp256k1Signature } from './keys'
import { JSONDatum } from './types'

export class RequestChallengeStage extends Stage {

  publicKey: Secp256k1PublicKey

  constructor(publicKey: Secp256k1PublicKey) {
    super("requestChallenege")
    this.publicKey = publicKey
  }

  sendServerCommand(connMan: ConnectionManager) {
    assert(this.publicKey)
    connMan.sendJSON({
      type: 'connect',
      pubKey: this.publicKey.toHexString(),
    })
  }

  // We are unlikely to ever get here.
  // 
  enqueueDatum(datum: JSONDatum) {
    throw new Error("Finish connecting before sending data")
  }

  parseReplyToNextStage(datum: JSONDatum, parent: Client) {
    if (datum.type === 'verify') {
      const challengeSig = parent.keyPair.sign(challenge)
      console.log("server success received, challengeSig ", challengeSig)
      return new SignChallengeStage(challengeSig, this.publicKey)
    } else {
      console.error("Received unexpected pmessage", JSON.stringify(datum))
    }
  }

}

export class SignChallengeStage extends Stage {

  publicKey: Secp256k1PublicKey
  challengeSig: Secp256k1Signature

  constructor(challengeSig: Secp256k1Signature, publicKey: Secp256k1PublicKey) {
    super("sign")
    this.challengeSig = challengeSig
    this.publicKey = publicKey
  }

  enqueueDatum(datum: JSONDatum) {
    throw new Error("Finish connecting before sending data")
  }

  sendServerCommand(connMan: ConnectionManager) {
    connMan.sendJSON({
      type: 'verify',
      pubKey: this.publicKey.toHexString(),
      msg: this.challengeSig.toHexString(),
    })
  }

  parseReplyToNextStage(datum: JSONDatum, parent: Client) {
    if (datum.type === 'success') {
      console.log("Successfully connected client ${this.publicKey}")
      return null
    }
  }

}

// Private classes for singletons

const RegisterStage = class extends Stage {

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
