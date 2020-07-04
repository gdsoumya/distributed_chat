'use strict'

import { Client } from './client'
import { ConnectionManager } from './connMan'
import { JSONDatum } from './types'

export abstract class Stage {

  private name: string

  constructor(name: string) {
    this.name = name
  }

  start(connMan: ConnectionManager): void {
    this.sendServerCommand(connMan: ConnectionManager)
  }

  abstract sendServerCommand(connMan: connectionManager): void

  abstract parseReplyToNextStage(datum: JSONDatum, parent: Client): void

  abstract enqueueDatum(datum: JSONDatum): void

}