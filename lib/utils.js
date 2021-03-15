import { Buffer } from "buffer";
import elliptic from "elliptic";
import ethutils from "ethereumjs-util";
import bs58 from "bs58";

const secp256k1 = new elliptic.ec( 'secp256k1' )

export function createKeyPair() {
	const kp = secp256k1.genKeyPair()
	const publicKey = kp.getPublic( 'hex' )
	const privateKey = kp.getPrivate( 'hex' )
	const address = toEthereumAddress( publicKey )
	return { address, publicKey, privateKey }
}

export function toEthereumAddress( hexPublicKey ) {
	return `0x${ethutils.keccak( Buffer.from( hexPublicKey.slice( 2 ), 'hex' ) )
		.slice( -20 )
		.toString( 'hex' )}`
}

export function stripHexPrefix( str ) {
	return str.startsWith( "0x" ) ? str.slice( 2 ) : str;
}

export function leftPad( data, size = 64 ) {
	if( data.length === size ) return data;
	return "0".repeat( size - data.length ) + data;
}

export async function signData( identity, key, data, nonce, registry ) {
	const paddedNonce = leftPad( Buffer.from( [nonce], 64 ).toString( "hex" ) );
	const dataToSign =
		`1900${stripHexPrefix( registry )}${paddedNonce}${stripHexPrefix( identity )}${data}`;
	const hash = Buffer.from( ethutils.sha3( Buffer.from( dataToSign, "hex" ) ) );
	const signature = ethutils.ecsign( hash, Buffer.from( key, 'hex' ) );
	return {
		r: `0x${signature.r.toString( "hex" )}`,
		s: `0x${signature.s.toString( "hex" )}`,
		v: signature.v
	};
}

export function stringToBytes32( str ) {
	const buffstr =
		'0x' +
		Buffer.from( str )
			.slice( 0, 32 )
			.toString( 'hex' )
	return buffstr + '0'.repeat( 66 - buffstr.length )
}

export function bytes32toString( bytes32 ) {
	return Buffer.from( bytes32.slice( 2 ), 'hex' )
		.toString( 'utf8' )
		.replace( /\0+$/, '' )
}

export function parseDID( did ) {
	if( did === '' ) throw new Error( 'Missing DID' )
	const sections = did.match( /^did:([a-zA-Z0-9_]+):([a-zA-Z0-9_]+):([:[a-zA-Z0-9_.-]+)(\/[^#]*)?(#.*)?$/ )
	if( sections ) {
		const parts = { did: sections[0], method: sections[1], network: sections[2], id: sections[3] }
		if( sections[4] ) parts.path = sections[4]
		if( sections[5] ) parts.fragment = sections[5].slice( 1 )
		return parts
	}
	throw new Error( "Invalid DID" )
}

export function getRelationship( verificationMethods, relationships ) {
	return relationships
		.map( relationship => verificationMethods.find( vm => vm.id === relationship ) )
		.filter( vm => vm );
}

export function getExistingMethods( verificationMethods, relationships ) {
	return relationships
		.filter( relationship => verificationMethods.find( vm => vm.id === relationship ) );
}

export function attributeToHex( key, value ) {
	const match = key.match( /(vm|auth|asse|keya|dele|invo|svc)\/(\w+)?\/(\w+)?$/ )
	if( match ) {
		const encoding = match[3]
		if( encoding === 'base64' ) {
			return `0x${Buffer.from( value, 'base64' ).toString( 'hex' )}`
		} else  if( encoding === 'base58' ) {
			return `0x${bs58.decode( value ).toString( 'hex' )}`
		}
	}
	if( value.match( /^0x[0-9a-fA-F]*$/ ) ) {
		return value
	}
	return `0x${Buffer.from( value ).toString( 'hex' )}`
}

export const keyAlgorithms = {
	jwk: 'JsonWebKey2020',
	esecp256k1vk: 'EcdsaSecp256k1VerificationKey2019',
	esecp256k1rm: 'EcdsaSecp256k1RecoveryMethod2020',
	edd25519vk: 'Ed25519VerificationKey2018',
	gpgvk: 'GpgVerificationKey2020',
	rsavk: 'RsaVerificationKey2018',
	x25519ka: 'X25519KeyAgreementKey2019',
	ssecp256k1vk: 'SchnorrSecp256k1VerificationKey2019'
}

export const keyTypes = {
	verification: {
		esecp256k1vk: 'EcdsaSecp256k1VerificationKey2019',
		ssecp256k1vk: 'SchnorrSecp256k1VerificationKey2019',
		edd25519vk: 'Ed25519VerificationKey2018',
		gpgvk: 'GpgVerificationKey2020',
		rsavk: 'RsaVerificationKey2018',
	},
	keyAgreement: 'X25519KeyAgreementKey2019',
	jwk: 'JsonWebKey2020',
	esecp256k1rm: 'EcdsaSecp256k1RecoveryMethod2020',
}