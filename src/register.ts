// Common stages for registering a client
'use strict'

import { Stage } from './stage'
import { ClientState } from './client'
import { ConnectionManager } from './connMan'
import { Secp256k1PublicKey, Secp256k1Signature } from './keys'
import { JSONDatum } from './types'
import { assert } from 'chai'

export class RequestChallengeStage extends Stage {

  constructor(clientState: ClientState) {
    super("requestChallenge", clientState)
  }

  sendServerCommand(connMan: ConnectionManager) {
    connMan.sendDatum({
      type: 'connect',
      fromPublicKey: this.clientState.keyPair.getPublicKey().toHexString(),
    })
  }

  // We are unlikely to ever get here.
  // 
  enqueueUserDatum(datum: JSONDatum) {
    throw new Error("Finish connecting before sending data")
  }

  parseReplyToNextState(datum: JSONDatum) {
    if (datum.type === 'verify') {
      const challengeSig = this.clientState.keyPair.sign(msg)
      console.log("server success received, challengeSig ", challengeSig)
      return ClientState.fromPreviousState(this.clientState, new SignChallengeStage(challengeSig, this.clientState)
    } else {
      console.error("Received unexpected pmessage", JSON.stringify(datum))
      return this.clientState
    }
  }

}

export class SignChallengeStage extends Stage {

  challengeSig: Secp256k1Signature

  constructor(challengeSig: Secp256k1Signature, clientState: ClientState) {
    super("sign", clientState)
    this.challengeSig = challengeSig
  }

  enqueueUserDatum(datum: JSONDatum) {
    throw new Error("Finish connecting before sending data")
  }

  sendServerCommand(connMan: ConnectionManager) {
    connMan.sendDatum({
      type: 'verify',
      fromPublicKey: this.publicKey.toHexString(),
      msg: this.challengeSig.toHexString(),
    })
  }

  parseReplyToNextState(datum: JSONDatum) {
    if (datum.type === 'success') {
      console.log("Successfully connected client ${this.publicKey}")
      return ClientState.fromNextStageCreator(this.clientState)
    } else {
      console.error("Received unexpected message", JSON.stringify(datum))
      return this.clientState
    }
  }

}