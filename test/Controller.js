const DIDRegistry = artifacts.require( "DIDRegistry" );

contract( "DIDRegistry", accounts => {
	it( "should change controller", async() => {
		const instance = await DIDRegistry.deployed();
		await instance.changeController( accounts[0], accounts[1], { from: accounts[0] } );

		return assert.equal(
			await instance.controllers.call( accounts[0] ),
			accounts[1],
			"DIDRegistry didn't change controller"
		);
	} );

	it( "should not change again controller", async() => {
		const instance = await DIDRegistry.deployed();
		try {
			await instance.changeController( accounts[0], accounts[2], { from: accounts[0] } );
		} catch( e ) {
			return assert.equal(
				e.message,
				"Returned error: VM Exception while processing transaction: revert",
				"DIDRegistry did change controller"
			);
		}
	} );

	it( "should change controller from current controller", async() => {
		const instance = await DIDRegistry.deployed();

		await instance.changeController( accounts[0], accounts[2], { from: accounts[1] } );

		return assert.equal(
			await instance.controllers.call( accounts[0] ),
			accounts[2],
			"DIDRegistry didn't change controller"
		);
	} );
} );