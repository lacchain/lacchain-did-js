const ethutils = require( "ethereumjs-util" );

const DIDRegistry = artifacts.require( "DIDRegistryRecoverable" );

const addresses = [
	'0x9a0d6fcbe696b30aadb8b10f71a8d14502b38325',
	'0x5ac03d827dc1caad73933d375f0f85a77efd8514',
	'0x6a3bf40f418ad5af57e58c1db6e65b7458f6e421',
	'0xfce1066dfd086c03fd0b83d81160ad808983bc88',
	'0xabc53a335449ed76ab7963f80e61b1ea3d68c2e0'
]
const privateKeys = [
	'e4cae20a84c2b06f733928ac8fe7c8fea2bf56340e945441a5c500a70a9f9444',
	'6c782722b2311eed153ca657efe5132271f0ccd4e7a88015927db30eeddd39c8',
	'27ebca688eb924168ba68cd71247a5ecb73aa738f0b595ecdf875e7531e1187d',
	'adbff22951acb7680cbba6c3ff7639f88498e8c4991d2dcd266026b2c27553c1',
	'4242db427a841cb31ab913f02133b4bfad8e98af83a2c1373012d5368e0ffbd3'
];

function leftPad( data, size = 64 ) {
	if( data.length === size ) return data;
	return "0".repeat( size - data.length ) + data;
}

function stripHexPrefix( str ) {
	return str.startsWith( "0x" ) ? str.slice( 2 ) : str;
}

async function signData( identity, key, address ) {
	const paddedNonce = leftPad( Buffer.from( [0], 64 ).toString( "hex" ) );
	const dataToSign =
		`1900${stripHexPrefix( DIDRegistry.address )}${paddedNonce}${stripHexPrefix( identity )}${Buffer.from( "recover" ).toString( "hex" ) + stripHexPrefix( address )}`;
	const hash = Buffer.from( ethutils.sha3( Buffer.from( dataToSign, "hex" ) ) );
	const signature = ethutils.ecsign( hash, Buffer.from( key, 'hex' ) );
	return {
		r: `0x${signature.r.toString( "hex" )}`,
		s: `0x${signature.s.toString( "hex" )}`,
		v: signature.v
	};
}

const sleep = seconds => new Promise( resolve => setTimeout( resolve, seconds * 1e3 ) );

contract( "DIDRegistry Recoverable", accounts => {

	before( async() => {
		const instance = await DIDRegistry.deployed();
		await instance.addController( accounts[0], addresses[0], { from: accounts[0] } );
		await instance.addController( accounts[0], addresses[1], { from: accounts[0] } );
		await instance.addController( accounts[0], addresses[2], { from: accounts[0] } );
	} )

	it( "should not have the minimum keys", async() => {
		const instance = await DIDRegistry.deployed();
		try {
			const sign = await signData( accounts[0], privateKeys[1], addresses[1] );
			await instance.recover( accounts[0], sign.v, sign.r, sign.s, accounts[1], { from: accounts[0] } );
		} catch( e ) {
			return assert.equal(
				e.message,
				"Returned error: VM Exception while processing transaction: revert Identity must have the minimum of controllers -- Reason given: Identity must have the minimum of controllers.",
				"DIDRegistry did add controller"
			);
		}
	} );

	it( "should fail the recover signature", async() => {
		const instance = await DIDRegistry.deployed();
		try {
			await instance.addController( accounts[0], addresses[3], { from: accounts[0] } );
			const sign = await signData( accounts[0], privateKeys[1], addresses[2] );
			await instance.recover( accounts[0], sign.v, sign.r, sign.s, addresses[1], { from: accounts[0] } );
		} catch( e ) {
			return assert.equal(
				e.message,
				"Returned error: VM Exception while processing transaction: revert Invalid signature -- Reason given: Invalid signature.",
				"DIDRegistry did add controller"
			);
		}
	} );

	it( "should exceed failed attempts", async() => {
		const instance = await DIDRegistry.deployed();

		try {
			const sign = await signData( accounts[0], privateKeys[2], addresses[2] );
			for( const _ of [0, 1, 2, 3, 4] ) {
				await instance.recover( accounts[0], sign.v, sign.r, sign.s, addresses[2], { from: accounts[0] } );
			}
		} catch( e ) {
			return assert.equal(
				e.message,
				"Returned error: VM Exception while processing transaction: revert Exceeded attempts -- Reason given: Exceeded attempts.",
				"DIDRegistry did add controller"
			);
		}
	} );

	it( "should pass max attempts by waiting reset time", async() => {
		const instance = await DIDRegistry.deployed();
		const sign = await signData( accounts[0], privateKeys[2], addresses[2] );
		for( const i of [0, 1, 2] ) {
			await sleep( 6 );
			await instance.recover( accounts[0], sign.v, sign.r, sign.s, addresses[2], { from: accounts[0] } );
		}
	} );

	it( "should recover key successfully", async() => {
		const instance = await DIDRegistry.deployed();
		const controller = await instance.identityController.call( accounts[0] );
		await sleep( 6 );
		for( const i of [0, 1, 2] ) {
			const sign = await signData( accounts[0], privateKeys[i], addresses[i] );
			await instance.recover( accounts[0], sign.v, sign.r, sign.s, addresses[i], { from: accounts[0] } );
		}
		const recoveredController = await instance.identityController.call( accounts[0] );

		assert.notEqual( controller, recoveredController,
			"DIDRegistry did add controller"
		);
		return assert.equal( recoveredController.toLowerCase(), addresses[2].toLowerCase(),
			"DIDRegistry did add controller"
		);
	} );

} );