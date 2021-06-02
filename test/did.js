import chai from 'chai';
import bs58 from "bs58";
import chaiAsPromised from "chai-as-promised";
import DID from "../lib/did.js";
import DIDRecoverable from "../lib/didrecoverable.js";
import { createKeyPair, sleep } from "../lib/utils.js";

const expect = chai.expect;
chai.use( chaiAsPromised );
chai.should();

describe( 'DID', () => {
	const readOnly = new DID( {
		address: '0x8adda74623d30d2dd9642119b0ea4f51b476e253',
		registry: '0xbDa1238272FDA6888556449Cb77A87Fc8205E8ba',
		rpcUrl: 'https://writer.lacchain.net',
		network: 'main'
	} );
	const did = new DID( {
		registry: '0xbDa1238272FDA6888556449Cb77A87Fc8205E8ba',
		rpcUrl: 'https://writer.lacchain.net',
		network: 'main'
	} );
	const didRecoverable = new DIDRecoverable( {
		registry: '0xC9Be468e482Fb0bD8f34e224c25C905b99820308',
		rpcUrl: 'https://writer.lacchain.net',
		network: 'main'
	} );
	const controller0 = {
		address: did.address,
		privateKey: did.config.controllerPrivateKey + ''
	};
	const controller1 = createKeyPair();
	const controller2 = createKeyPair();
	const controller3 = createKeyPair();
	const controller4 = createKeyPair();

	const veryKey = createKeyPair();
	const authKey = createKeyPair();
	const asseKey = createKeyPair();
	const keyaKey = createKeyPair();
	const invoKey = createKeyPair();
	const deleKey = createKeyPair();

	it( 'should fail to create a DID without address', async() => {
		try {
			new DID( {
				controllerPrivateKey: '8adda74623d30d2dd9642119b0ea4f51b476e2533bE8DD330d2dd9642119bda74623d',
				registry: '0x4C7bCd86F81e52368C975949D8B070F47C4c3767',
				rpcUrl: 'http://localhost:8545',
				network: 'main'
			} );
		} catch( e ) {
			expect( e.message ).to.equals( 'If you set the controller private key you must also provide the DID address' );
		}
	} );

	it( 'should add DID controller', async() => {
		await did.addController( controller1.address );
		const controllers = await did.getControllers();

		expect( controllers.length ).to.equals( 2 );
	} );

	it( 'should change the DID controller', async() => {
		await did.changeController( controller1.address );
		const controller = await did.getController();

		expect( controller.toLowerCase() ).to.equals( controller1.address.toLowerCase() );
	} );

	it( 'should fail to change the DID controller', async() => {
		try {
			await did.changeController( did.address );
		} catch( e ) {
			expect( e.reason ).to.equals( "transaction failed" );
		}
	} );

	it( 'should change the DID controller using a signed tx', async() => {
		await did.changeControllerSigned( controller1.privateKey, did.address );
		const controller = await did.getController();

		expect( controller.toLowerCase() ).to.equals( did.address.toLowerCase() );
	} );

	it( 'should remove last DID controller', async() => {
		await did.removeController( controller1.address );
		const controllers = await did.getControllers();

		expect( controllers.length ).to.equals( 1 );
	} );

	it( 'should fail to change a read-only DID controller', async() => {
		try {
			await readOnly.changeController( controller1.address );
		} catch( e ) {
			expect( e.message ).to.equals( "Cannot change controller to a read-only DID" );
		}
	} );

	it( "should do automatic key rotation", async() => {
		await did.addController( controller2.address );
		await did.addController( controller3.address );
		await did.addController( controller4.address );

		await did.enableKeyRotation( 10 );

		const firstController = await did.getController();
		await sleep( 10 );
		const lastController = await did.getController();

		expect( firstController ).to.not.be.equal( lastController );
	} );

	it( "should not do automatic key rotation", async() => {
		const lastController = await did.getController();
		did.setControllerKey(
			[controller0, controller1, controller2, controller3, controller4]
				.find( c => c.address.toLowerCase() === lastController.toLowerCase() )
				.privateKey
		);
		await did.disableKeyRotation();
		did.setControllerKey( controller0.privateKey );
		await did.changeController( controller4.address );
		did.setControllerKey( controller4.privateKey );

		const currentController = await did.getController();

		expect( currentController.toLowerCase() ).to.equal( controller4.address.toLowerCase() );
	} );

	it( 'should add a Verification Method', async() => {
		await did.addVerificationMethod( {
			type: 'vm',
			algorithm: 'esecp256k1rm',
			encoding: 'hex',
			publicKey: `0x${veryKey.publicKey}`,
			controller: did.address
		} );
		const document = await did.getDocument();

		expect( document.verificationMethod ).to.not.be.null;
		expect( document.verificationMethod ).to.have.lengthOf( 2 );
		expect( document.verificationMethod[1].publicKeyHex ).to.equal( veryKey.publicKey );
	} );

	it( 'should add an Authentication Method', async() => {
		await did.addAuthenticationMethod( {
			algorithm: 'esecp256k1rm',
			encoding: 'hex',
			publicKey: `0x${authKey.publicKey}`,
			controller: did.address
		} );
		const document = await did.getDocument();

		expect( document.verificationMethod ).to.have.lengthOf( 3 );
		expect( document.verificationMethod[2].publicKeyHex ).to.equal( authKey.publicKey );

		expect( document.authentication ).to.not.be.null;
		expect( document.authentication ).to.have.lengthOf( 2 );
		expect( document.authentication[1].publicKeyHex ).to.equal( authKey.publicKey );
	} );

	it( 'should bind an Authentication Method', async() => {
		await did.bindAuthenticationMethod( `${did.id}#vm-1` );
		const document = await did.getDocument();

		expect( document.verificationMethod ).to.have.lengthOf( 3 );

		expect( document.authentication ).to.not.be.null;
		expect( document.authentication ).to.have.lengthOf( 3 );
		expect( document.authentication[2].publicKeyHex ).to.equal( veryKey.publicKey );
	} );

	it( 'should add an Assertion Method', async() => {
		const publicKeyBase64 = new Buffer( asseKey.publicKey, 'hex' ).toString( 'base64' );
		await did.addAssertionMethod( {
			algorithm: 'esecp256k1vk',
			encoding: 'base64',
			publicKey: publicKeyBase64,
			controller: did.address
		} );
		const document = await did.getDocument();

		expect( document.verificationMethod ).to.have.lengthOf( 4 );
		expect( document.verificationMethod[3].publicKeyBase64 ).to.equal( publicKeyBase64 );

		expect( document.assertionMethod ).to.not.be.null;
		expect( document.assertionMethod ).to.have.lengthOf( 2 );
		expect( document.assertionMethod[1].publicKeyBase64 ).to.equal( publicKeyBase64 );
	} );

	it( 'should bind and Assertion Method', async() => {
		await did.bindAssertionMethod( `${did.id}#vm-1` );
		const document = await did.getDocument();

		expect( document.verificationMethod ).to.have.lengthOf( 4 );

		expect( document.assertionMethod ).to.not.be.null;
		expect( document.assertionMethod ).to.have.lengthOf( 3 );
		expect( document.assertionMethod[2].publicKeyHex ).to.equal( veryKey.publicKey );
	} );

	it( 'should add a Key Agreement', async() => {
		const publicKeyBase58 = bs58.encode( new Buffer( keyaKey.publicKey, 'hex' ) );
		await did.addKeyAgreement( {
			algorithm: 'esecp256k1vk',
			encoding: 'base58',
			publicKey: publicKeyBase58,
			controller: did.address
		} );
		const document = await did.getDocument();

		expect( document.verificationMethod ).to.have.lengthOf( 5 );
		expect( document.verificationMethod[4].publicKeyBase58 ).to.equal( publicKeyBase58 );

		expect( document.keyAgreement ).to.not.be.null;
		expect( document.keyAgreement ).to.have.lengthOf( 2 );
		expect( document.keyAgreement[1].publicKeyBase58 ).to.equal( publicKeyBase58 );
	} );

	it( 'should bind a Key Agreement', async() => {
		await did.bindKeyAgreement( `${did.id}#vm-1` );
		const document = await did.getDocument();

		expect( document.verificationMethod ).to.have.lengthOf( 5 );

		expect( document.keyAgreement ).to.not.be.null;
		expect( document.keyAgreement ).to.have.lengthOf( 3 );
		expect( document.keyAgreement[2].publicKeyHex ).to.equal( veryKey.publicKey );
	} );

	it( 'should add a Capability Invocation', async() => {
		await did.addCapabilityInvocation( {
			algorithm: 'esecp256k1vk',
			encoding: 'hex',
			publicKey: `0x${invoKey.publicKey}`,
			controller: did.address
		} );
		const document = await did.getDocument();

		expect( document.verificationMethod ).to.have.lengthOf( 6 );
		expect( document.verificationMethod[5].publicKeyHex ).to.equal( invoKey.publicKey );

		expect( document.capabilityInvocation ).to.not.be.null;
		expect( document.capabilityInvocation ).to.have.lengthOf( 2 );
		expect( document.capabilityInvocation[1].publicKeyHex ).to.equal( invoKey.publicKey );
	} );

	it( 'should bind a Capability Invocation', async() => {
		await did.bindCapabilityInvocation( `${did.id}#vm-1` );
		const document = await did.getDocument();

		expect( document.verificationMethod ).to.have.lengthOf( 6 );

		expect( document.capabilityInvocation ).to.not.be.null;
		expect( document.capabilityInvocation ).to.have.lengthOf( 3 );
		expect( document.capabilityInvocation[2].publicKeyHex ).to.equal( veryKey.publicKey );
	} );

	it( 'should add a Capability Delegation', async() => {
		await did.addCapabilityDelegation( {
			algorithm: 'esecp256k1vk',
			encoding: 'pem',
			publicKey: deleKey.publicKey,
			controller: did.address
		} );
		const document = await did.getDocument();

		expect( document.verificationMethod ).to.have.lengthOf( 7 );
		expect( document.verificationMethod[6].publicKeyPem ).to.equal( deleKey.publicKey );

		expect( document.capabilityDelegation ).to.not.be.null;
		expect( document.capabilityDelegation ).to.have.lengthOf( 2 );
		expect( document.capabilityDelegation[1].publicKeyPem ).to.equal( deleKey.publicKey );
	} );

	it( 'should bind a Capability Delegation', async() => {
		await did.bindCapabilityDelegation( `${did.id}#vm-1` );
		const document = await did.getDocument();

		expect( document.verificationMethod ).to.have.lengthOf( 7 );

		expect( document.capabilityDelegation ).to.not.be.null;
		expect( document.capabilityDelegation ).to.have.lengthOf( 3 );
		expect( document.capabilityDelegation[2].publicKeyHex ).to.equal( veryKey.publicKey );
	} );

	it( 'should revoke a Verification Method', async() => {
		await did.revokeVerificationMethod( {
			type: 'vm',
			algorithm: 'esecp256k1rm',
			encoding: 'hex',
			publicKey: `0x${veryKey.publicKey}`,
			controller: did.address
		} );
		const document = await did.getDocument();

		expect( document.verificationMethod ).to.have.lengthOf( 6 );
		expect( document.verificationMethod[1].publicKeyHex ).to.not.equal( veryKey.publicKey );
	} );

	it( 'should add a Service', async() => {
		await did.addService( {
			type: 'mailbox',
			endpoint: 'https://mailbox.lacchain.net'
		} );
		const document = await did.getDocument();

		expect( document.service ).to.have.lengthOf( 1 );
		expect( document.service[0].type ).to.equal( 'mailbox' );
		expect( document.service[0].serviceEndpoint ).to.equal( 'https://mailbox.lacchain.net' );
	} );

	it( 'should get the DID Document in explicit mode', async() => {
		did.config.mode = 'explicit';
		const document = await did.getDocument();
		expect( document.toJSON() ).to.not.be.null;
	} );

	it( 'should get the DID Document in reference mode', async() => {
		did.config.mode = 'reference';
		const document = await did.getDocument();
		expect( document.toJSON() ).to.not.be.null;
	} );

} );