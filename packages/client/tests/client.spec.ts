// Test suite for instantiating and kicking off websocket clients
// for basic channel joining stages

import { assert } from 'chai'
import {
  PublicChannelClient, WebSocketConnectionManager, integer, JSONDatum, Stage,
} from '..'

const createClients = (channelName: string) => {
  const wsc1 = new WebSocketConnectionManager({
    host: 'localhost',
    port: 8546 as integer,
    useWSS: false, // local instance won't have TLS enabled
  });

  const wsc2 = new WebSocketConnectionManager({
    host: 'localhost',
    port: 8546 as integer,
    useWSS: false, // local instance won't have TLS enabled
  });

  const client = new PublicChannelClient(channelName, 'iceking', wsc1, 1 as integer);

  const client2 = new PublicChannelClient(channelName, 'abracadaniel', wsc2, 1 as integer)

  return { client, client2 }

}

describe('WebSocket clients', () => { // eslint-disable-line no-undef

  it('has three remaining stages', async () => { // eslint-disable-line no-undef

    const { client, client2 } = createClients('villains')

    assert.equal(client.getBuilder().getClientState().remainingStageCreators.count(), 2,
      'Expected 2 remaining stage creators for public channel client.')
  })

  it('sends arbitrary JSON fields', async () => {

    const { client, client2 } = createClients('sorcerers')

    const expectedMessages = [
      'hello2',
    ]

    const listenerFunc = (preStage: Stage, postStage: Stage, userDatum: JSONDatum) => {
      const expectedMsg = expectedMessages.pop()
      console.log('Receiving in special fields')
      assert(expectedMsg, 'Ran out of expected messages')
      assert.equal(userDatum.type, 'msg')
      assert.equal(userDatum.special, 'special2')
      assert.equal(userDatum.msg, expectedMsg)
    }
    const prom1 = new Promise((resolve, reject) => {
      const wrappedListenerFunc = (preStage: Stage, postStage: Stage, userDatum: JSONDatum) => {
        try {
          listenerFunc(preStage, postStage, userDatum)
          resolve(true)
        } catch (e) {
          reject(e)
        }
      }
      client.addStageListener('publicMessage', 'publicMessage', wrappedListenerFunc)
    })

    await client.start();
    await client2.start()

    setTimeout(async () => {
      await client.enqueueUserDatum({
        type: 'msg',
        special: 'special1',
        msg: 'hello1'
      });
      await client2.enqueueUserDatum({
        type: 'msg',
        special: 'special2',
        msg: 'hello2'
      });
    }, 2000)

    await prom1

  })

  it('joins a public channel', async () => { // eslint-disable-line no-undef

    const { client, client2 } = createClients('wizards')

    const expectedMessages = [
      'hello2',
    ]

    const listenerFunc = (preStage: Stage, postStage: Stage, userDatum: JSONDatum) => {
      const expectedMsg = expectedMessages.pop()
      assert(expectedMsg, 'Ran out of expected messages')
      assert.equal(userDatum.msg, expectedMsg)
    }
    const prom1 = new Promise((resolve, reject) => {
      const wrappedListenerFunc = (preStage: Stage, postStage: Stage, userDatum: JSONDatum) => {
        try {
          listenerFunc(preStage, postStage, userDatum)
          resolve(true)
        } catch (e) {
          reject(e)
        }
      }
      client.addStageListener('publicMessage', 'publicMessage', wrappedListenerFunc)
    })

    await client.start();
    await client2.start()

    setTimeout(async () => {
      await client.enqueueMessage('hello1');
      await client2.enqueueMessage('hello2');
    }, 2000)

    await prom1

    // client.removeStageListener(listenerId)

  });
});
