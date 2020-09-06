// Test suite for instantiating and kicking off websocket clients
// for basic channel joining stages

import { assert } from 'chai'
import {
  PublicChannelClient, WebSocketConnectionManager, integer,
} from '..'

console.log('TYPEOF', typeof WebSocketConnectionManager)

describe('WebSocket clients', () => { // eslint-disable-line no-undef
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

  const client = new PublicChannelClient('wizards', 'iceking', wsc1);

  const client2 = new PublicChannelClient('wizards', 'abracadaniel', wsc2)

  it('has three remaining stages', async () => { // eslint-disable-line no-undef
    assert.equal(client.getBuilder().getClientState().remainingStageCreators.count(), 2,
      'Expected 2 remaining stage creators for public channel client.',
    )
  })

  it('joins a public channel', async () => { // eslint-disable-line no-undef

    //await client.start();
    //await client.enqueueMessage('hello');

    //await client2.start()
  });
});
