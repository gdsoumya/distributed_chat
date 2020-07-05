const secp256k1 = require('secp256k1');
const { randomBytes } = require('crypto');
const { TextEncoder } = require('text-encoder');
const uuid4 = require('uuid').v4;
function genKeyPair() {
	while (true) {
		const privKey = randomBytes(32);
		if (secp256k1.privateKeyVerify(privKey)) {
			return privKey;
		}
	}
}

const privateKey = genKeyPair();
const msg = new TextEncoder().encode(uuid4().replace('-', '').slice(0, 32));
const publicKey = Buffer.from(secp256k1.publicKeyCreate(privateKey)).toString('hex');
console.log(publicKey);
const sigObj = secp256k1.ecdsaSign(msg, privateKey);
console.log(Buffer.from(sigObj.signature).toString('hex'));
const sig = Buffer.from(sigObj.signature).toString('hex');
console.log(
	secp256k1.ecdsaVerify(Uint8Array.from(Buffer.from(sig, 'hex')), msg, Uint8Array.from(Buffer.from(publicKey, 'hex')))
);

const { publicEncrypt, privateDecrypt } = require('crypto');

var toEncrypt = 'my secret text to be encrypted';
var encryptBuffer = Buffer.from(toEncrypt);
var encrypted = publicEncrypt(Uint8Array.from(Buffer.from(publicKey, 'hex')), encryptBuffer);
