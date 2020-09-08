import readline from 'readline'
import { Client } from './client'
import { ConnectionManager } from '../connmans/connMan'
import { RequestChallengeStageCreator } from '../stages/register'

const { List } = require('immutable')

export const ChatClient = class extends Client {

  constructor(connMan: ConnectionManager) {
    super(connMan, List([RequestChallengeStageCreator]), List())
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
    }).on('close', () => {
      process.exit(0);
    });
  }

  processLine(line: string) {
    const msg = line.split(' ');
    if (msg[0].toLowerCase() === 'private' && msg.length >= 3) {
      this.enqueueUserDatum({
        type: 'msg',
        fromPublicKey: this.builder.getClientState().keyPair.getPublicKey().toHexString(),
        toPublicKey: msg[1],
        msg: msg.slice(2).join(' '),
      })
    } else if (msg.length === 3 && msg[0].toLowerCase() === 'join') {
      this.enqueueUserDatum({
        type: 'join',
        channel: msg[1],
        userName: msg[2],
        fromPublicKey: this.builder.getClientState().keyPair.getPublicKey().toHexString(),
      })
      console.log(`CHANNEL NAME : ${msg[1]}  |   USERNAME : ${msg[2]}`);
    } else if (msg.length >= 2) {
      if (msg.length >= 3) {
        this.enqueueUserDatum({
          type: 'msg',
          fromPublicKey: this.builder.getClientState().keyPair.getPublicKey().toHexString(),
          msg: msg.slice(2).join(' '),
        })
      }
    }
  }

  triggerQueueProcessing() {
    // TODO: Is this the right thing to do, to buffer for interactive chat client
    return this
  }

}

export default ChatClient