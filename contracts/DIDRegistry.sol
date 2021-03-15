pragma solidity ^0.5.16;

contract DIDRegistry {

	mapping(address => address) public controllers;
	mapping(address => uint) public changed;
	mapping(address => uint) public nonce;

	modifier onlyController(address identity, address actor) {
		require (actor == identityController(identity));
		_;
	}

	event DIDControllerChanged(
		address indexed identity,
		address controller,
		uint previousChange
	);

	event DIDAttributeChanged(
		address indexed identity,
		bytes32 name,
		bytes value,
		address controller,
		uint validTo,
		uint previousChange
	);

	function identityController(address identity) public view returns(address) {
		address controller = controllers[identity];
		if (controller != address(0)) {
			return controller;
		}
		return identity;
	}

	function checkSignature(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes32 hash) internal returns(address) {
		address signer = ecrecover(hash, sigV, sigR, sigS);
		require(signer == identityController(identity));
		nonce[signer]++;
		return signer;
	}

	function changeController(address identity, address actor, address newController) internal onlyController(identity, actor) {
		controllers[identity] = newController;
		emit DIDControllerChanged(identity, newController, changed[identity]);
		changed[identity] = block.number;
	}

	function changeController(address identity, address newController) public {
		changeController(identity, msg.sender, newController);
	}

	function changeControllerSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, address newController) public {
		bytes32 hash = keccak256(abi.encodePacked(byte(0x19), byte(0), this, nonce[identityController(identity)], identity, "changeController", newController));
		changeController(identity, checkSignature(identity, sigV, sigR, sigS, hash), newController);
	}

	function setAttribute(address identity, address actor, bytes32 name, bytes memory value, address controller, uint validity ) internal onlyController(identity, actor) {
		emit DIDAttributeChanged(identity, name, value, controller, now + validity, changed[identity]);
		changed[identity] = block.number;
	}

	function setAttribute(address identity, bytes32 name, bytes memory value, address controller, uint validity) public {
		setAttribute(identity, msg.sender, name, value, controller, validity);
	}

	function setAttributeSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes32 name, bytes memory value, address controller, uint validity) public {
		bytes32 hash = keccak256(abi.encodePacked(byte(0x19), byte(0), this, nonce[identityController(identity)], identity, "setAttribute", name, value, validity));
		setAttribute(identity, checkSignature(identity, sigV, sigR, sigS, hash), name, value, controller, validity);
	}

	function revokeAttribute(address identity, address actor, bytes32 name, bytes memory value ) internal onlyController(identity, actor) {
		emit DIDAttributeChanged(identity, name, value, address(0), 0, changed[identity]);
		changed[identity] = block.number;
	}

	function revokeAttribute(address identity, bytes32 name, bytes memory value) public {
		revokeAttribute(identity, msg.sender, name, value);
	}

	function revokeAttributeSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes32 name, bytes memory value) public {
		bytes32 hash = keccak256(abi.encodePacked(byte(0x19), byte(0), this, nonce[identityController(identity)], identity, "revokeAttribute", name, value));
		revokeAttribute(identity, checkSignature(identity, sigV, sigR, sigS, hash), name, value);
	}

}