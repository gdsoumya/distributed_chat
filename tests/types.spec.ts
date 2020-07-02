'use strict'

import { Secp256k1PublicKey, Secp256k1PrivateKey } from '..'

describe('Darkchat types', () => {
	
	it('detects valid secp256k1 keypairs', async () => {
		const pubKey: Secp256k1PublicKey = new Secp256k1PublicKey(
			'025c3d90e6da3324d9b2460ba7aab41bba7f76b0da2b2f2fa4a3b512ff48e598a4'
			)
		const privKey: Secp256k1PrivateKey = new Secp256k1PrivateKey(
			'b492d96f7ba566b3a8fd29d9cf8995057baf876c9171d42ee9a11eb3a2b205f4'
			)
	})
})