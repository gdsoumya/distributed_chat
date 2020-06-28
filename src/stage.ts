'use strict'

import { Client } from './client'
import { ConnectionManager } from './connMan'
import { DataJSON } from './types'

export abstract class Stage {

  private name: string

  constructor(name: string) {
    this.name = name
  }

  start(connectionManager): void {
    this.sendServerCommand(connectionManager)
  }

  abstract sendServerCommand(cm: connectionManager): void

  abstract parseReplyToNextStage(dataJSON: DataJSON, parent: Client): void

  abstract enqueueMessage(message: DataJSON): void

}