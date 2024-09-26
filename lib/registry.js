import * as ethers from 'ethers';
import lacchain from "@lacchain/gas-model-provider";
import DIDRegistryContract from './DIDRegistry.json'  assert { type: 'json'};
import DIDRegistryContractOld from './DIDRegistry_old.json'  assert { type: 'json'};
import { Buffer } from 'buffer'
import { attributeToHex, signData, stringToBytes, stripHexPrefix } from "./utils.js";

export default class DIDRegistry {

	constructor( conf = {} ) {
		this.conf = conf;
		this.provider = this.configureProvider( conf );
		if (!ethers.utils.isAddress(conf.registry)) {
			throw new Error( "Invalid 'registry' attribute" );
		}
		this.registry = new ethers.Contract( conf.registry, conf.nodeAddress ? DIDRegistryContract.abi : DIDRegistryContractOld.abi, this.provider );
	}

	configureProvider( conf = {} ) {
		if( conf.web3 ) {
			return new ethers.providers.Web3Provider( conf.web3.currentProvider )
		} else if( conf.controllerPrivateKey ) {
			if( conf.nodeAddress ){
				const provider = new lacchain.GasModelProvider(conf.rpcUrl)
				return new lacchain.GasModelSigner(conf.controllerPrivateKey, provider, conf.nodeAddress, conf.expiration);
			} else {
				const provider = new ethers.providers.JsonRpcProvider( conf.rpcUrl );
				return new ethers.Wallet( conf.controllerPrivateKey, provider );
			}
		}
		return new ethers.providers.JsonRpcProvider( conf.rpcUrl );
	}


	async lookupController( address ) {
		return this.registry.identityController( address )
	}


	async getControllers( address ) {
		if( this.conf.nodeAddress )
			return this.registry.getControllers( address )
		return this.registry.getControllers()
	}

	async changeControllerSigned( address, controllerPrivateKey, newController ) {
		const nonce = await this.registry.nonce( newController );
		const sig = await signData(
			address,
			controllerPrivateKey,
			Buffer.from( "changeController" ).toString( "hex" ) +
			stripHexPrefix( newController ),
			nonce.toNumber(),
			this.conf.registry
		);
		return await this.registry.changeControllerSigned(
			address,
			sig.v,
			sig.r,
			sig.s,
			newController,
			{
				gasLimit: 1000000,
				gasPrice: 0
			}
		);
	}

	addController( address, newController ) {
		return this.registry.addController( address, newController, {
			gasLimit: 1000000,
			gasPrice: 0
		} )
	}

	removeController( address, controller ) {
		return this.registry.removeController( address, controller, {
			gasLimit: 1000000,
			gasPrice: 0
		} )
	}

	changeController( address, newController ) {
		return this.registry.changeController( address, newController, {
			gasLimit: 1000000,
			gasPrice: 0
		} )
	}

	setAttribute( address, key, value, expiresIn = 31536000 ) {
		return this.registry.setAttribute( address,
			stringToBytes( key ),
			attributeToHex( key, value ),
			expiresIn,
			{
				gasLimit: 1000000,
				gasPrice: 0
			}
		);
	}

	async revokeAttribute( address, key, value ) {
		return this.registry.revokeAttribute(
			address,
			stringToBytes( key ),
			attributeToHex( key, value ),
			{
				gasLimit: 1000000,
				gasPrice: 0
			}
		)
	}

	enableKeyRotation( address, keyRotationTime ) {
		return this.registry.enableKeyRotation( address, keyRotationTime, {
			gasLimit: 1000000,
			gasPrice: 0
		} )
	}

	disableKeyRotation( address ) {
		return this.registry.disableKeyRotation( address, {
			gasLimit: 1000000,
			gasPrice: 0
		} )
	}


}
