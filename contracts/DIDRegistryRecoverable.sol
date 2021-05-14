//SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.6.0 <0.7.0;

import "./DIDRegistry.sol";

contract DIDRegistryRecoverable is DIDRegistry {

    uint private maxAttempts;
    uint private minControllers;
    uint private resetSeconds;

    constructor(uint _minKeyRotationTime, uint _maxAttempts, uint _minControllers, uint _resetSeconds) DIDRegistry( _minKeyRotationTime ) public {
        maxAttempts = _maxAttempts;
        minControllers = _minControllers;
        resetSeconds = _resetSeconds;
    }

    mapping(address => address[]) public recoveredKeys;
    mapping(address => uint) public failedAttempts;
    mapping(address => uint) public lastAttempt;

    function recover(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, address proofController) public {
        require(controllers[identity].length >= minControllers, "Identity must have the minimum of controllers");
        bytes32 hash = keccak256(abi.encodePacked(byte(0x19), byte(0), this, nonce[identityController(identity)], identity, "recover", proofController));
        address signer = ecrecover(hash, sigV, sigR, sigS);
        require(signer == proofController, "Invalid signature");

        require(failedAttempts[identity] < maxAttempts || block.timestamp - lastAttempt[identity] > resetSeconds, "Exceeded attempts");

        if( _getControllerIndex( identity, proofController ) < 0 ) return;

       if( block.timestamp - lastAttempt[identity] > resetSeconds ){
            failedAttempts[identity] = 0;
            delete recoveredKeys[identity];
        }
        lastAttempt[identity] = block.timestamp;

        int recoveredIndex = _getRecoveredIndex(identity, proofController);
        if (recoveredIndex >= 0) {
            failedAttempts[identity] += 1;
            return;
        }

        recoveredKeys[identity].push(proofController);

        if (recoveredKeys[identity].length >= controllers[identity].length.div(2).add(1)) {
            changeController(identity, identity, proofController);
            delete recoveredKeys[identity];
        }
    }

    function _getRecoveredIndex(address identity, address controller) internal view returns (int) {
        for (uint i = 0; i < recoveredKeys[identity].length; i++) {
            if (recoveredKeys[identity][i] == controller) {
                return int(i);
            }
        }
        return -1;
    }

}