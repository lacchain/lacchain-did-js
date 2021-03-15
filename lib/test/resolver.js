import chai from 'chai';

import chaiAsPromised from "chai-as-promised";
import { getResolver } from "../resolver.js";

const expect = chai.expect;
chai.use( chaiAsPromised );
chai.should();

describe( 'DIDResolver', () => {
	const did = 'did:lac:main:0xcd7ebd413d512b47d1d48e5ed27fe01c8c29fd98';
	const invalid = 'dsid:lac:axcd7ebd413d512b47d1d48e5ed27fe01c8c29fd98';
	const resolver = getResolver( {
		networks: [{
			name: 'main',
			registry: '0xb0DF0067b8208B899f9B29dD716551B4703AeD73',
			rpcUrl: 'https://writer.lacchain.net',
		}]
		// mode: 'explicit'
	} );

	it( 'should resolve the DID Document', async() => {
		const document = await resolver.lac( did );
		expect( document ).to.be.not.null;
	} );

	it( 'should fail to resolve the Document of an invalid DID', async() => {
		try {
			await resolver.lac( invalid );
		} catch( e ) {
			expect( e.message ).to.equals( 'Invalid DID' );
		}
	} );

} );