import DID from "./did.js";
import { signData, stripHexPrefix } from "./utils.js";
import DIDRegistryRecoverable from "./registryrecoverable.js";

export default class DIDRecoverable extends DID {

	constructor( config ) {
		super( config );
		this.registry = new DIDRegistryRecoverable( config );
	}

	async recover( controller, privateKey ) {
		if( this.readOnly ) throw new Error( "Cannot perform a recover key to a read-only DID" );
		const signature = await signData( this.address, privateKey,
			Buffer.from( "recover" ).toString( "hex" ) + stripHexPrefix( controller ),
			0, this.config.registry );
		const tx = await this.registry.recover( this.address, signature, controller );
		return await tx.wait();
	}

}
