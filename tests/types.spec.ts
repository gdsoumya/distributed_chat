import { assert } from 'chai'
import { Secp256k1PublicKey, Secp256k1PrivateKey } from '..'

describe('Darkchat types', () => { // eslint-disable-line no-undef

  it('detects valid secp256k1 keypairs', async () => { // eslint-disable-line no-undef
    const pubKey: Secp256k1PublicKey = Secp256k1PublicKey.fromString(
      '025c3d90e6da3324d9b2460ba7aab41bba7f76b0da2b2f2fa4a3b512ff48e598a4',
    )
    const keyPair: Secp256k1PrivateKey = Secp256k1PrivateKey.fromString(
      'b492d96f7ba566b3a8fd29d9cf8995057baf876c9171d42ee9a11eb3a2b205f4',
    )
    assert(pubKey !== null)
    assert(keyPair !== null)
  })
})