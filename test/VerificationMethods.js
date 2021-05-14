/* const DIDRegistry = artifacts.require( "DIDRegistry" );

contract( "DIDRegistry", accounts => {
	it( "should add verificationMethod", async() => {
		const verificationMethod = {
			name: web3.utils.asciiToHex( "vm/Secp256k1/am/hex" ),
			value: web3.utils.asciiToHex( "0x0000000000000000000000001" )
		};
		const instance = await DIDRegistry.deployed();
		const change = await instance.setAttribute( accounts[0],
			verificationMethod.name,
			verificationMethod.value,
			accounts[1], 342242344,
			{ from: accounts[0] } );

		assert.lengthOf(change.logs, 1, 'No events emitted');

		return assert.include( change.logs[0].args, {
				identity: accounts[0],
				name: web3.utils.padRight( verificationMethod.name, 64 ),
				value: verificationMethod.value,
				controller: accounts[1],
			},
			"DIDRegistry didn't add the Verification Method"
		);
	} );
} );*/