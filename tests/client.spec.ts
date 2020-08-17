// Test suite for instantiating and kicking off websocket clients
// for basic channel joining stages
'use strict'

import { List } from 'immutable'
import {
  PublicChannelClient, WebSocketConnectionManager, Stage, integer
} from '..'
const { assert } = require('chai')

describe('WebSocket clients', () => {

  const wsConnMan = new WebSocketConnectionManager({
    host: 'localhost',
    port: 8546 as integer,
    useWSS: false, // local instance won't have TLS enabled
  })

  const stageChangeListeners = List([
    (oldStage: Stage, newStage: Stage) => {
      console.log('old stage', oldStage)
      console.log('new stage', newStage)
    }
  ])

  const client = new PublicChannelClient('wizards', 'iceking', wsConnMan, stageChangeListeners, 1 as integer)

  //const client2 = new PublicChannelClient('wizards', 'abracadaniel', wsConnMan, stageChangeListeners)

  it('joins a public channel', async () => {
      await client.start()
      await client.enqueueMessage('hello')
      //await client2.start()
  })

})