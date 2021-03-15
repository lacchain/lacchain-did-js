import chai from 'chai';

import chaiAsPromised from "chai-as-promised";
import { createKeyPair } from "../utils.js";
import DIDRegistry from "../registry.js";
import Web3 from "web3";

const expect = chai.expect;
chai.use( chaiAsPromised );
chai.should();

describe( 'Registry', () => {
	const user1 = createKeyPair();
	const user2 = createKeyPair();

	const signingKey = createKeyPair();

	const registryAddress = '0xb0DF0067b8208B899f9B29dD716551B4703AeD73';
	const rpcUrl = 'https://writer.lacchain.net';

	it( 'should change the DID Controller', async() => {
		const registry = new DIDRegistry( {
			registry: registryAddress, rpcUrl,
			controllerPrivateKey: user1.privateKey
		} );
		const tx = await registry.changeController( user1.address, user2.address );
		await tx.wait();
		const newController = await registry.lookupController( user1.address );
		expect( newController.toLowerCase() ).to.equals( user2.address.toLowerCase() );
	} );

	it( 'should set new attribute', async() => {
		const registry = new DIDRegistry( {
			registry: registryAddress, rpcUrl,
			controllerPrivateKey: user2.privateKey
		} );
		const tx = await registry.setAttribute( user1.address,
			'vm/Ed25519/veriKey/hex',
			'0x' + signingKey.publicKey,
			user1.address );
		const receipt = await tx.wait();
		expect( receipt.status ).to.equals( 1 );
	} );

	it( 'fail to set new attribute', async() => {
		const registry = new DIDRegistry( {
			registry: registryAddress, rpcUrl,
			controllerPrivateKey: user1.privateKey
		} );
		const tx = await registry.setAttribute( user1.address,
			'vm/Ed25519/hex',
			'0x' + signingKey.publicKey,
			user1.address );
		try {
			await tx.wait();
		} catch( e ) {
			expect( e.reason ).to.equals( "transaction failed" );
		}
	} );

	it( 'should revoke the attribute', async() => {
		const registry = new DIDRegistry( {
			registry: registryAddress, rpcUrl,
			controllerPrivateKey: user2.privateKey
		} );
		const tx = await registry.revokeAttribute( user1.address,
			'vm/Ed25519/hex',
			'0x' + signingKey.publicKey );
		const receipt = await tx.wait();
		expect( receipt.status ).to.equals( 1 );
	} );

	it( 'should create registry using web3', async() => {
		const registry = new DIDRegistry( {
			registry: registryAddress,
			web3: new Web3( rpcUrl )
		} );
		const controller = await registry.lookupController( user2.address );

		expect( controller.toLowerCase() ).to.equals( user2.address.toLowerCase() );
	} );

} );