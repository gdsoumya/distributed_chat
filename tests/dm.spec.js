// Test suite for encrypted direct messages
'use strict'

const { WebSocketClient } = require('..')
const { assert } = require('chai')

describe('Encrypted direct messages', () => {
  
  before(async () => {
      
  })

  const connectClient = async (expected) =>  {
    return new Promise((resolve, reject) => {
      let wsc = new WebSocketClient({ host: 'localhost', port: 8546 })

      let stage = 'verify'

      wsc.addMessageListener((_data) => {
        const data = JSON.parse(_data)
        console.log(JSON.stringify(data))
        assert.equal( data['type'], stage, `${stage} type message not received, instead ${JSON.stringify(data)}` )

        assert( data['msg'], `data has no msg member, instead ${JSON.stringify(data)}` )
        
        // TODO: Implement stages properly in typescript client.
        if (stage === 'verify') {
          stage = 'success'
          const challenge = data['msg']
          resolve({ wsc, challenge })
        } else if (stage === 'success') {
          stage = 'msg'
        } else {
          assert.equal( data['msg'], expected.msg, `Mismatched msg` )
          assert.equal( data['pk'], expected.sender, `Mismatched sender` )
          assert.equal( data['private'], wsc.publicKey, `Mismatched recipient pk`)
        }

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


  it('start with client 1 generating a valid public key', async () => {
    
    let client1
    let publicKey1
    let client2
    let publicKey2
    let expected1 = {}
    let expected2 = {}

    {
      const { wsc, challenge } = await connectClient(expected1)
      client1 = wsc
      publicKey1 = client1.publicKey
      await new Promise((resolve) => {
        setTimeout(() => {
          wsc.sendMessage('verify', client1.genSignature(challenge).toString('hex'))
          resolve(true)
        }, 500)
      })
    }

    {
      const { wsc, challenge } = await connectClient(expected2)
      client2 = wsc
      publicKey2 = client2.publicKey
      await new Promise((resolve) => {
        setTimeout(() => {
          wsc.sendMessage('verify', client2.genSignature(challenge).toString('hex'))
          resolve(true)
        }, 500)
      })
    }

    assert.equal(publicKey1.length, 66, `Public key length was ${publicKey1.length}`)
    assert.equal(publicKey2.length, 66, `Public key length was ${publicKey2.length}`)

    expected1.msg = 'message from 1 to 2'
    expected1.sender = publicKey2

    expected2.msg = 'message from 2 to 1'
    expected2.sender = publicKey1

    await new Promise((resolve) => {
      setTimeout(() => {
        client1.sendMessage('msg', expected2.msg, publicKey2)
        resolve(true)
      }, 500)
    })
    await new Promise((resolve) => {
      setTimeout(() => {
        client2.sendMessage('msg', expected1.msg, publicKey1)
        resolve(true)
      }, 500)
    })

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
