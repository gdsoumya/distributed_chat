'use strict'

import { ClientState  } from './client'
import { ConnectionManager } from './connMan'
import { JSONDatum } from './types'

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

  /**
   * Construct a new Client pipeline stage
   * @arg name a unique name identifying this stage
   * @arg clientState the client state when this stage was created,
   * i.e. at the end of the previous stage.
   */
  constructor(name: string) {
    this.name = name
  }

  start(connMan: ConnectionManager): void {
    this.sendServerCommand(connMan)
  }

  abstract sendServerCommand(connMan: ConnectionManager): void

  abstract parseReplyToNextState(serverDatum: JSONDatum, clientState: ClientState): ClientState

  abstract enqueueUserDatum(datum: JSONDatum): void

}