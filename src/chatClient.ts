'use strict'

import { Client } from './client'
import { Stage } from './stage'
const { List } = require('immutable')
const { assert } = require('chai')

const pubClients = {}

pubClients.ChatClient = class extends Client {
	
  constructor(channelName, userName, connMan) {
    super(new JoinStage(channelName, userName), connMan)
    // TODO: Kludge!
    // Attach the publicKey of this client to the first stage
    this.currentStage.publicKey = this.publicKey
    this.joinStage = this.currentStage
    this.messageStage = new PublicMessageStage(this.publicKey)
  }

  /**
   * Register readline interactive REPL. (Don't use for tests)
   */
  startChat() {
    this.start()
    const rl = readline.createInterface(process.stdin, process.stdout);
    rl.prompt();
    rl.on('line', (line) => {
      if (line.toLowerCase() === 'exit') rl.close();
      this.processLine(line);
      rl.prompt();
    }).on('close', function () {
      process.exit(0);
    });
  }

}