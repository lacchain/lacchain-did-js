import DIDRegistry from './registry.js';
import * as ethers from "ethers";
import DIDRegistryRecoverableContract from "./lac1/DIDRegistryRecoverableGM-270-RC1-1f3dc10f.json"; // TODO improve

export default class DIDRegistryRecoverable extends DIDRegistry {

	constructor( conf = {} ) {
		super( conf );
		const provider = this.configureProvider( conf );
		this.registry = new ethers.Contract( conf.registry, DIDRegistryRecoverableContract.abi, provider );
	}

	recover( address, signature, controller ) {
		return this.registry.recover( address, signature.v, signature.r, signature.s, controller, {
			gasLimit: 10000000,
			gasPrice: 0
		} )
	}

}
