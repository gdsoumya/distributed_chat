'use strict'

const secp256k1 = require('secp256k1')
import { assert } from 'chai'
import { WebSocket } from '@types/ws'

export class Secp256k1PublicKey {

	constructor(publicKey: string) {
		assert.equal(publicKey.length, 66, `Public key had length ${publicKey.length} instead of 66`)
		assert(secp256k1.publicKeyVerify(Uint8Array.from(Buffer.from(publicKey))),
			`Invalid public key hex string ${publicKey}`)
		return publicKey
	}

}

export class Secp256k1PrivateKey {

	constructor(privateKey: string) {
		assert.equal(privateKey.length, 64, `Public key had length ${privateKey.length} instead of 66`)
		assert(secp256k1.privateKeyVerify(Uint8Array.from(Buffer.from(privateKey))),
			`Invalid private key hex string ${privateKey})`
			)
		return privateKey
	}

}

export type DataJSON = {
	[key: string]: string
}

export type Socket = WebSocket