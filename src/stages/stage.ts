'use strict'

import { ClientState  } from '../clients/client'
import { ConnectionManager } from '../connmans/connMan'
import { JSONDatum, StageCreator } from '../types'
import { ClientStateBuilder } from '../builder'

/**
 * A Stage is a state in a client protocol interaction,
 * similar to a finite-state-automaton, except that it
 * first emits a datum to the server, and waits / processes the
 * response.
 *
 * When processing the response, and then possibly updates the client state,
 * including creating a new stage and popping the next stage
 * creator in the queue.

 * Stages have access to a parent clientState from when they
 * were created, which they can reference in 
 */
export abstract class Stage {

  readonly name: string
  readonly builder: ClientStateBuilder

  /**
   * Construct a new Client pipeline stage
   * @arg name a unique name identifying this stage
   * @arg clientState the client state when this stage was created,
   * i.e. at the end of the previous stage.
   */
  constructor(name: string, builder: ClientStateBuilder) {
    this.name = name
    this.builder = builder
  }

  start(connMan: ConnectionManager): void {
    this.sendServerCommand(connMan)
  }

  abstract sendServerCommand(connMan: ConnectionManager): void

  abstract parseReplyToNextBuilder(serverDatum: JSONDatum): ClientStateBuilder

}

class ErrorStage extends Stage {

  constructor(builder: ClientStateBuilder) {
    super('ErrorStage', builder)
    throw new Error("ErrorStage: we've run out of StageCreators in your protocol.")
  }

  sendServerCommand(): void {
    throw new Error("ErrorStage: we've run out of StageCreators in your protocol")
  }
  parseReplyToNextBuilder(serverDatum: JSONDatum): ClientStateBuilder {
    throw new Error("ErrorStage: we've run out of StageCreators in your protocol")
  }

}

export const ErrorStageCreator: StageCreator = (builder: ClientStateBuilder) => {
  return new ErrorStage(builder)
}