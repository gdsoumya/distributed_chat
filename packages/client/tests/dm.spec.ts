// Test suite for encrypted direct messages

import { assert } from 'chai';
import {
  PrivateChannelClient, WebSocketConnectionManager, integer, Stage, JSONDatum,
} from '..'
import { Secp256k1KeyPair } from '../src/keys';

// eslint-disable-next-line no-undef
describe('Encrypted direct messages', () => {

  const wsConnMan1 = new WebSocketConnectionManager({
    host: 'localhost',
    port: 8546 as integer,
    useWSS: false, // local instance won't have TLS enabled
  });
  const wsConnMan2 = new WebSocketConnectionManager({
    host: 'localhost',
    port: 8546 as integer,
    useWSS: false, // local instance won't have TLS enabled
  });

  /* eslint-disable no-undef */
  it('exchanges two encrypted DMs between clients', async () => {
  /* eslint-enable no-undef */

    const keyPair1 = new Secp256k1KeyPair()
    const keyPair2 = new Secp256k1KeyPair()
    const client1 = new PrivateChannelClient(
      keyPair2.getPublicKey(),
      wsConnMan1,
      1 as integer,
      keyPair1,
    )

    const client2 = new PrivateChannelClient(
      keyPair1.getPublicKey(),
      wsConnMan2,
      1 as integer,
      keyPair2,
    )

    const expected2Message1 = 'private message from 1 to 2'
    const expected2Message2 = 'another private message from 1 to 2'
    const expected2Message3 = 'unsent private message from 1 to 2'

    const expected1Message = 'private message from 2 to 1'

    const prom1 = client1.addListenerWrapPromise('requestChallenge', 'signChallenge',
      (preStage: Stage, postStage: Stage, userDatum: JSONDatum) => {
        assert.equal(userDatum.type, 'verify', `Verify message not found ${JSON.stringify(userDatum)}`)
      })

    const expectedMessages = [
      expected1Message,
      'Connected to Network',
      'MESSAGE SENT',
    ]
    const prom2 = client1.addListenerWrapPromise('privateMessage', 'privateMessage',
      (preStage: Stage, postStage: Stage, userDatum: JSONDatum) => {
        const nextMsg = expectedMessages.pop()
        // console.log(`Client 1 MSG: ${userDatum.msg} ${nextMsg} ${userDatum.msg === nextMsg}`)
        assert.equal(userDatum.msg, nextMsg, 'Client 1 privateMessage mismatch')
      })

    const expected2Messages = [
      expected2Message3,
      expected2Message2,
      'bobo the clown0',
      expected2Message1,
    ]

    const listenerFunc2 = (preStage: Stage, postStage: Stage, userDatum: JSONDatum) => {
      const nextMsg = expected2Messages.pop()
      // console.log(`Client 2 MSG: ${userDatum.msg} ${nextMsg} ${userDatum.msg === nextMsg}`)
      assert(userDatum.msg === nextMsg, `${userDatum.msg} !== ${nextMsg}`)
      assert.equal(userDatum.msg, nextMsg, 'Client 2 privateMessage mismatch')
    }

    const prom3 = client2.addListenerWrapPromise(
      'privateMessage', 'privateMessage',
      listenerFunc2,
    )

    client1.start()
    client2.start()

    await prom1 // client1 register as DM

    // In real life, messages are enqueued by user after client starts
    setTimeout(() => client1.enqueueMessage(expected2Message1), 1000)
    // client2.enqueueMessage(expected1Message)

    await prom2 // client1 MESSAGE SENT

    // console.log('PROM 2')

    await prom3 // client2 expected2Message1

    // console.log('PROM 3')

    const prom4 = client2.addListenerWrapPromise('privateMessage', 'privateMessage',
      listenerFunc2)

    client1.enqueueMessage(expected2Message2)
    client1.getBuilder().startStage()

    try {
      await prom4 // client2 bobo the clown0 false
    } catch (e) {
      //
    }

    /*
    const prom5 = client2.addListenerWrapPromise('privateMessage', 'privateMessage',
      listenerFunc2)

    // If we were to wait for this, it would never return
     await prom5
     */
  })

})
