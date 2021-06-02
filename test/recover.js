import chai from 'chai';
import chaiAsPromised from "chai-as-promised";
import DIDRecoverable from "../lib/didrecoverable.js";
import { createKeyPair, sleep } from "../lib/utils.js";

const expect = chai.expect;
chai.use( chaiAsPromised );
chai.should();

describe( 'DIDRecoverable', () => {
	const did = new DIDRecoverable( {
		registry: '0x21D8dB083E0515EB2c8918CD49ea56C5B900ecef',
		rpcUrl: 'https://writer.lacchain.net',
		network: 'main'
	} );

	const controller1 = createKeyPair();
	const controller2 = createKeyPair();
	const controller3 = createKeyPair();
	const controller4 = createKeyPair();

	before( async() => {
		await did.addController( controller1.address );
		await did.addController( controller2.address );
		await did.addController( controller3.address );
	} )

	it( "should not have the minimum keys", async() => {
		try {
			await did.recover( controller1.address, controller1.privateKey );
		} catch( e ) {
			expect( e.reason ).to.equal( "transaction failed" )
		}
	} );

	it( "should fail the recover signature", async() => {
		await did.addController( controller4.address );
		try {
			await did.recover( controller1.address, controller2.privateKey );
		} catch( e ) {
			expect( e.reason ).to.equal( "transaction failed" )
		}
	} );

	it( "should exceed failed attempts", async() => {
		try {
			for( const _ of [0, 1, 2, 3, 4] ) {
				await did.recover( controller1.address, controller1.privateKey );
			}
		} catch( e ) {
			expect( e.reason ).to.equal( "transaction failed" );
		}
	} );

	it( "should pass max attempts by waiting reset time", async() => {
		await sleep( 10 );
		await did.recover( controller1.address, controller1.privateKey );
	} );

	it( "should recover key successfully", async() => {
		await sleep( 10 );
		const controller = await did.getController();
		await did.recover( controller2.address, controller2.privateKey );
		await did.recover( controller3.address, controller3.privateKey );
		await did.recover( controller4.address, controller4.privateKey );
		const recoveredController = await did.getController();

		expect( controller ).to.not.be.equal( recoveredController );
		expect( recoveredController.toLowerCase() ).to.equal( controller4.address.toLowerCase() );
	} );
} );