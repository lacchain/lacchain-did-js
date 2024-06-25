import { getExistingMethods, getRelationship } from "./utils.js";

export default class DIDDocument {

	constructor( document, mode = 'reference' ) {
		this.id = document.id;
		this.alsoKnownAs = document.alsoKnownAs;
		this.controller = document.controller;
		this.verificationMethod = document.verificationMethod;
		this.authentication = getRelationship( document.verificationMethod, document.authentication );
		this.assertionMethod = getRelationship( document.verificationMethod, document.assertionMethod );
		this.keyAgreement = getRelationship( document.verificationMethod, document.keyAgreement );
		this.capabilityInvocation = getRelationship( document.verificationMethod, document.capabilityInvocation );
		this.capabilityDelegation = getRelationship( document.verificationMethod, document.capabilityDelegation );
		this.service = document.service;
		this.mode = mode;
		this.document = document;
	}

	toJSON() {
		if( this.mode === 'explicit' )
			return {
				id: this.id,
				alsoKnownAs: this.alsoKnownAs,
				controller: this.controller,
				verificationMethod: this.verificationMethod,
				authentication: this.authentication,
				assertionMethod: this.assertionMethod,
				keyAgreement: this.keyAgreement,
				capabilityInvocation: this.capabilityInvocation,
				capabilityDelegation: this.capabilityDelegation,
				service: this.service
			};
		const document = this.document;
		return {
			id: this.id,
			alsoKnownAs: this.alsoKnownAs,
			controller: this.controller,
			verificationMethod: this.document.verificationMethod,
			authentication: getExistingMethods( document.verificationMethod, document.authentication ),
			assertionMethod: getExistingMethods( document.verificationMethod, document.assertionMethod ),
			keyAgreement: getExistingMethods( document.verificationMethod, document.keyAgreement ),
			capabilityInvocation: getExistingMethods( document.verificationMethod, document.capabilityInvocation ),
			capabilityDelegation: getExistingMethods( document.verificationMethod, document.capabilityDelegation ),
			service: this.service
		};
	}

}