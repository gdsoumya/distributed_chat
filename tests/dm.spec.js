// Test suite for encrypted direct messages
'use strict'

const { WebSocketClient } = require('..')
const { assert } = require('chai')

describe('Encrypted direct messages', () => {
  
  before(async () => {
      
  })

  const connectClient = async () =>  {
    return new Promise((resolve, reject) => {
      let wsc = new WebSocketClient({ host: 'localhost', port: 8546 })

      wsc.addMessageListener((_data) => {
        const data = JSON.parse(_data)
        assert.equal( data['type'], 'verify', `verify message not received, instead ${JSON.stringify(data)}` )
        assert( data['msg'], `data has no msg member, instead ${JSON.stringify(data)}` )
        const challenge = data['msg']
        resolve({ wsc, challenge })
      })

      wsc.start() 
      assert.equal( typeof(wsc.publicKey), 'string',
          `Client public key was not a string, instead ${typeof(wsc.publicKey)}`
          )
      assert.equal( wsc.publicKey.length, 66,
          `Client public key length was not 66 was instead ${wsc.publicKey.length}`
          )
      wsc.on('open', () => {
        wsc.sendMessage('connect')
      })
    })
  }

  let client1
  let publicKey1
  let client2
  let publicKey2

  it('start with client 1 generating a valid public key', async () => {
    
    const { wsc, challenge } = await connectClient()
    client1 = wsc
    publicKey1 = client1.publicKey
    wsc.sendMessage('verify', client1.genSignature(challenge))

  })

  /*
  it('start with client 2 generating a valid public key', async () => {
    
    const { wsc, challenge } = await connectClient()
    client2 = wsc
    publicKey2 = client2.publicKey
    wsc.sendMessage('verify', challenge)

  })
*/

})
