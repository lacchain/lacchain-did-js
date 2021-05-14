import DIDRegistry from './registry.js';

export default class DIDRegistryRecoverable extends DIDRegistry {

	constructor( conf = {} ) {
		super( conf );
	}

	recover( address, signature, controller ) {
		return this.registry.recover( address, signature.v, signature.r, signature.s, controller, {
			gasLimit: 1000000,
			gasPrice: 0
		} )
	}

}
