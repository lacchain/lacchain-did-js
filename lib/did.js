import DIDRegistry from "./registry.js";
import { createKeyPair } from "./utils.js";
import { getResolver } from "./resolver.js";

export default class DID {

	constructor( config ) {
		this.config = config;
		if( config.controllerPrivateKey && !config.address ) {
			throw new Error( "If you set the controller private key you must also provide the DID address" );
		} else if( !config.controllerPrivateKey && config.address ) {
			this.address = config.address;
			this.readOnly = true;
		} else if( !config.controllerPrivateKey && !config.address ) {
			const keyPair = createKeyPair();
			this.address = keyPair.address;
			config.controllerPrivateKey = keyPair.privateKey;
		}
		this.registry = new DIDRegistry( config );
		this.resolver = getResolver( {
			...config,
			networks: [{
				name: config.network,
				registry: config.registry,
				rpcUrl: config.rpcUrl
			}]
		} );
	}

	get id() {
		return `did:lac:${this.config.network}:${this.address}`
	}

	getController() {
		return this.registry.lookupController( this.address );
	}

	getControllers() {
		const controllers = this.registry.getControllers(this.address);
		if( controllers.length <= 0 ) return [ this.address ];
	}

	setControllerKey( controllerPrivateKey ) {
		this.registry = new DIDRegistry( {
			...this.config,
			controllerPrivateKey
		} );
		this.readOnly = false;
	}

	async getDocument() {
		if( !this.config.network ) throw new Error( "You must specify the network to resolve the DID document" );
		const did = `did:lac:${this.config.network}:${this.address}`;
		return await this.resolver.lac( did );
	}

	async addController( controller ) {
		if( this.readOnly ) throw new Error( "Cannot add new controller to a read-only DID" );
		const tx = await this.registry.addController( this.address, controller );
		return await tx.wait();
	}

	async removeController( controller ) {
		if( this.readOnly ) throw new Error( "Cannot remove controller to a read-only DID" );
		const tx = await this.registry.removeController( this.address, controller );
		return await tx.wait();
	}

	async changeController( controller ) {
		if( this.readOnly ) throw new Error( "Cannot change controller to a read-only DID" );
		const tx = await this.registry.changeController( this.address, controller );
		return await tx.wait();
	}

	async changeControllerSigned( controllerPrivateKey, controller ) {
		if( this.readOnly ) throw new Error( "Cannot change controller to a read-only DID" );
		const tx = await this.registry.changeControllerSigned( this.address, controllerPrivateKey, controller );
		return await tx.wait();
	}

	async addVerificationMethod( vm ) {
		if( this.readOnly ) throw new Error( "Cannot add verification method to a read-only DID" );
		if( !vm.controller ) throw new Error( "You must specify the controller of the verification method" );
		const tx = await this.registry.setAttribute( this.address,
			`${vm.type}/${vm.controller}/${vm.algorithm}/${vm.encoding}`,
			vm.publicKey,
			vm.expiration );
		return await tx.wait();
	}

	async revokeVerificationMethod( vm ) {
		if( this.readOnly ) throw new Error( "Cannot revoke verification method to a read-only DID" );
		const tx = await this.registry.revokeAttribute( this.address,
			`${vm.type}/${vm.controller}/${vm.algorithm}/${vm.encoding}`,
			vm.publicKey);
		return await tx.wait();
	}

	async bindVerificationMethod( vm ) {
		if( this.readOnly ) throw new Error( "Cannot bind verification method to a read-only DID" );
		const tx = await this.registry.setAttribute( this.address,
			`${vm.type}///`,
			vm.publicKey,
			31536000 );
		return await tx.wait();
	}

	async addAuthenticationMethod( am ) {
		return await this.addVerificationMethod( {
			...am,
			type: 'auth',
			controller: am.controller || this.address
		} );
	}

	async bindAuthenticationMethod( fragment ) {
		return await this.bindVerificationMethod( {
			type: 'auth',
			publicKey: fragment
		} );
	}

	async addAssertionMethod( am ) {
		return await this.addVerificationMethod( {
			...am,
			type: 'asse',
			controller: am.controller || this.address
		} );
	}

	async bindAssertionMethod( fragment ) {
		return await this.bindVerificationMethod( {
			type: 'asse',
			publicKey: fragment
		} );
	}

	async addKeyAgreement( ka ) {
		return await this.addVerificationMethod( {
			...ka,
			type: 'keya',
			controller: ka.controller || this.address
		} );
	}

	async bindKeyAgreement( fragment ) {
		return await this.bindVerificationMethod( {
			type: 'keya',
			publicKey: fragment
		} );
	}

	async addCapabilityInvocation( ci ) {
		return await this.addVerificationMethod( {
			...ci,
			type: 'invo',
			controller: ci.controller || this.address
		} );
	}

	async bindCapabilityInvocation( fragment ) {
		return await this.bindVerificationMethod( {
			type: 'invo',
			publicKey: fragment
		} );
	}

	async addCapabilityDelegation( cd ) {
		return await this.addVerificationMethod( {
			...cd,
			type: 'dele',
			controller: cd.controller || this.address
		} );
	}

	async bindCapabilityDelegation( fragment ) {
		return await this.bindVerificationMethod( {
			type: 'dele',
			publicKey: fragment
		} );
	}

	async addService( { type, endpoint } ) {
		if( this.readOnly ) throw new Error( "Cannot add a service to a read-only DID" );
		const tx = await this.registry.setAttribute( this.address,
			`svc//${type}/hex`,
			endpoint );
		return await tx.wait();
	}

	async revokeService( { type, endpoint } ) {
		if( this.readOnly ) throw new Error( "Cannot revoke a service to a read-only DID" );
		const tx = await this.registry.revokeAttribute( this.address,
				`svc//${type}/hex`,
				endpoint );
		return await tx.wait();
	}

	async enableKeyRotation( keyRotationTime ) {
		if( this.readOnly ) throw new Error( "Cannot enable key rotation in a read-only DID" );
		const tx = await this.registry.enableKeyRotation( this.address, keyRotationTime );
		return await tx.wait();
	}

	async disableKeyRotation() {
		if( this.readOnly ) throw new Error( "Cannot disable key rotation in a read-only DID" );
		const tx = await this.registry.disableKeyRotation( this.address );
		return await tx.wait();
	}

}
