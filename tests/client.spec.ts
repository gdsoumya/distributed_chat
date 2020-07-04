// Test suite for instantiating and kicking off websocket clients
// for basic channel joining stages
'use strict'

import {
  PublicChannelClient, WebSocketConnectionManager, Stage
} from '..'
const { assert } = require('chai')

describe('WebSocket clients', () => {

  const wsConnMan = new WebSocketConnectionManager({
    host: 'localhost',
    port: 8546,
  })

  const client = new PublicChannelClient('wizards', 'iceking', wsConnMan)

  const client2 = new PublicChannelClient('wizards', 'abracadaniel', wsConnMan)
  client2.addStageChangeListener((oldStage: Stage, newStage: Stage) => {
    console.log('old stage', oldStage)
    console.log('new stage', newStage)
  })

  it('joins a public channel', async () => {
    return new Promise(async (resolve) => {
      client.addStageChangeListener((oldStage, newStage) => {
        assert.equal(oldStage, client1.joinStage)
        console.log('old stage', oldStage)
        console.log('new stage', newStage)
        client.enqueueMessage("hello")
        resolve(true)
      })
      await client.start()
      await client2.start()
    })
  })

})