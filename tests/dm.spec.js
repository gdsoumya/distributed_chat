// Test suite for encrypted direct messages
'use strict'

const { WebSocketClient, decryptHexString } = require('..')
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
          assert.equal( data['msg'], expected.msg, `Mismatched msg from ${expected.sender}` )
          assert.equal( data['fromPublicKey'], expected.sender, `Mismatched sender` )
          assert.equal( data['toPublicKey'], wsc.publicKey, `Mismatched recipient publicKey`)
          const sharedKey = Buffer.from(expected.sharedKey.slice(1))
          const decryptedMsg = JSON.parse(decryptHexString({ encryptedHexString: data['msg'], key: sharedKey }))['msg']
          assert.equal( decryptedMsg, expected.decryptedMsg )
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
        wsc.constructAndSendMessage('connect')
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
          wsc.constructAndSendMessage('verify', client1.genSignature(challenge).toString('hex'))
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
          wsc.constructAndSendMessage('verify', client2.genSignature(challenge).toString('hex'))
          resolve(true)
        }, 500)
      })
    }

    assert.equal(publicKey1.length, 66, `Public key length was ${publicKey1.length}`)
    assert.equal(publicKey2.length, 66, `Public key length was ${publicKey2.length}`)

    expected2.decryptedMsg = 'private message from 1 to 2'
    expected1.decryptedMsg = 'private message from 2 to 1'

    const msgObj1 = client1.constructMessage('msg', expected2.decryptedMsg, publicKey2)
    expected1.sender = publicKey2

    const msgObj2 = client2.constructMessage('msg', expected1.decryptedMsg, publicKey1)
    expected2.sender = publicKey1

    assert.notEqual( msgObj1['msg'], msgObj2['msg'] )

    expected1.msg = msgObj2.msg // we expect client1 to receive the message sent from client 2
    expected2.msg = msgObj1.msg // we expected client2 to receive the message sent from client 1

    const sharedKey1 = client1.getSharedKeyAsBuffer(publicKey2)
    const sharedKey2 = client2.getSharedKeyAsBuffer(publicKey1)
    expected1.sharedKey = sharedKey1
    expected2.sharedKey = sharedKey2

    assert.equal(sharedKey1.toString('hex'), sharedKey2.toString('hex'),
        'Recovered shared keys from Diffie-Hellman exchange are not equal'
        )

    await new Promise((resolve) => {
      setTimeout(() => {
        console.log('msgObj2', JSON.stringify(msgObj2))
        client2.sendMessage(msgObj2)
        resolve(true)
      }, 1000)
    })
    await new Promise((resolve) => {
      setTimeout(() => {
        console.log('msgObj1', JSON.stringify(msgObj1))
        client1.sendMessage(msgObj1)
        resolve(true)
      }, 1000)
    })

  })

})
