// Common stages for registering a client
'use strict'

import { Stage } from './stage'
import { ClientState } from '../clients/client'
import { ConnectionManager } from '../connmans/connMan'
import { Secp256k1PublicKey, Secp256k1Signature } from '../keys'
import { JSONDatum, StageCreator } from '../types'
import { assert } from 'chai'
import { ClientStateBuilder } from '../builder'

export class RequestChallengeStage extends Stage {

  constructor(builder: ClientStateBuilder) {
    super("requestChallenge", builder)
  }

  sendServerCommand() {
    this.builder.getClientState().connectionManager.sendDatum({
      type: 'connect',
      fromPublicKey: this.builder.getClientState().keyPair.getPublicKey(),
    })
  }

  parseReplyToNextBuilder(datum: JSONDatum) {
    if (datum.type === 'verify') {
      if (!datum.msg) {
        throw new Error('Null msg for signing in RequestChallengeStage.')
      }
      const challengeSig = this.builder.getClientState().keyPair.sign(datum.msg)
      console.log("server success received, challengeSig ", challengeSig)
      return this.builder.toNextBuilder((builder: ClientStateBuilder) => new SignChallengeStage(challengeSig, builder))
    } else {
      console.error("Received unexpected pmessage", JSON.stringify(datum))
      return this.builder
    }
  }

}

export const RequestChallengeStageCreator: StageCreator = (builder: ClientStateBuilder) =>
  new RequestChallengeStage(builder)

export class SignChallengeStage extends Stage {

  challengeSig: Secp256k1Signature

  constructor(challengeSig: Secp256k1Signature, builder: ClientStateBuilder) {
    super("sign", builder)
    this.challengeSig = challengeSig
  }

  sendServerCommand() {
    this.builder.getClientState().connectionManager.sendDatum({
      type: 'verify',
      fromPublicKey: this.builder.getClientState().keyPair.getPublicKey(),
      msg: this.challengeSig.toHexString(),
    })
  }

  parseReplyToNextBuilder(datum: JSONDatum) {
    if (datum.type === 'success') {
      console.log(`Successfully connected client ${this.builder.getClientState().keyPair.getPublicKey().toHexString()}`)
      return this.builder.toNextBuilder()
    } else {
      console.error("Received unexpected message", JSON.stringify(datum))
      return this.builder
    }
  }

}