// Common stages for registering a client

/* eslint-disable max-classes-per-file */
import { assert } from 'chai'
import { Stage } from './stage'
import { Secp256k1Signature } from '../keys'
import { JSONDatum, StageCreator } from '../types'
import { ClientStateBuilder } from '../builder'

export class SignChallengeStage extends Stage {

  challengeSig: Secp256k1Signature

  constructor(challengeSig: Secp256k1Signature, builder: ClientStateBuilder) {
    super('signChallenge', builder)
    this.challengeSig = challengeSig
  }

  sendServerCommand() {
    assert(this.builder.getClientState().remainingStageCreators.count() >= 1, 'No remaining stage creators from SIGN CHALLENGE')
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
    }
    console.error('Received unexpected message', JSON.stringify(datum))
    return this.builder

  }

}

export class RequestChallengeStage extends Stage {

  constructor(builder: ClientStateBuilder) {
    super('requestChallenge', builder)
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
      console.log('server success received, challengeSig ', challengeSig) // eslint-disable-line no-console
      /* eslint-disable max-len */
      return this.builder.toNextBuilder((builder: ClientStateBuilder) => new SignChallengeStage(challengeSig, builder))
      /* eslint-disable max-len */
    }
    console.error('RequestChallenge: Received unexpected message', JSON.stringify(datum))
    return this.builder

  }

}

export const RequestChallengeStageCreator: StageCreator = (builder: ClientStateBuilder) => new RequestChallengeStage(builder)