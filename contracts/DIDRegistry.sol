//SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.6.0 <0.7.0;

import "./SafeMath.sol";
import "./IDIDRegistry.sol";

contract DIDRegistry is IDIDRegistry {

    using SafeMath for uint256;

    mapping(address => address[]) public controllers;
    mapping(address => DIDConfig) private configs;
    mapping(address => uint) public changed;
    mapping(address => uint) public nonce;

    uint private minKeyRotationTime;

    constructor( uint _minKeyRotationTime ) public {
        minKeyRotationTime = _minKeyRotationTime;
    }

    modifier onlyController(address identity, address actor) {
        require(actor == identityController(identity));
        _;
    }

    function getControllers() public view returns (address[] memory) {
        return controllers[msg.sender];
    }

    function identityController(address identity) public view returns (address) {
        uint len = controllers[identity].length;
        if (len == 0) return identity;
        if (len == 1) return controllers[identity][0];
        DIDConfig storage config = configs[identity];
        address controller = address(0);
        if( config.automaticRotation ){
            uint currentController = block.timestamp.div( config.keyRotationTime ).mod( len );
            controller = controllers[identity][currentController];
        } else {
            if( config.currentController >= len ){
                controller = controllers[identity][0];
            } else {
                controller = controllers[identity][config.currentController];
            }
        }
        if (controller != address(0)) return controller;
        return identity;
    }

    function checkSignature(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes32 hash) internal returns (address) {
        address signer = ecrecover(hash, sigV, sigR, sigS);
        require(signer == identityController(identity));
        nonce[signer]++;
        return signer;
    }

    function setCurrentController(address identity, uint index) internal {
        DIDConfig storage config = configs[identity];
        config.currentController = index;
    }

    function _getControllerIndex(address identity, address controller) internal view returns (int) {
        for (uint i = 0; i < controllers[identity].length; i++) {
            if (controllers[identity][i] == controller) {
                return int(i);
            }
        }
        return - 1;
    }

    function addController(address identity, address actor, address newController) internal onlyController(identity, actor) {
        int controllerIndex = _getControllerIndex(identity, newController);

        if (controllerIndex < 0) {
            if( controllers[identity].length == 0 ){
                controllers[identity].push( identity );
            }
            controllers[identity].push( newController );
        }
    }

    function removeController(address identity, address actor, address controller) internal onlyController(identity, actor) {
        require( controllers[identity].length > 1, 'You need at least two controllers to delete' );
        require( identityController(identity) != controller , 'You cannot delete current controller' );
        int controllerIndex = _getControllerIndex(identity, controller);

        require( controllerIndex >= 0, 'Controller not exist' );

        uint len = controllers[identity].length;
        address lastController = controllers[identity][len - 1];
        controllers[identity][uint(controllerIndex)] = lastController;
        if( lastController == identityController(identity) ){
            configs[identity].currentController = uint(controllerIndex);
        }
        delete controllers[identity][len - 1];
        controllers[identity].pop();
    }

    function changeController(address identity, address actor, address newController) internal onlyController(identity, actor) {
        int controllerIndex = _getControllerIndex(identity, newController);

        require( controllerIndex >= 0, 'Controller not exist' );

        if (controllerIndex >= 0) {
            setCurrentController(identity, uint(controllerIndex));

            emit DIDControllerChanged(identity, newController, changed[identity]);
            changed[identity] = block.number;
        }
    }

    function enableKeyRotation(address identity, address actor, uint keyRotationTime) internal onlyController(identity, actor) {
        require( keyRotationTime >= minKeyRotationTime, 'Invalid minimum key rotation time' );
        configs[identity].automaticRotation = true;
        configs[identity].keyRotationTime = keyRotationTime;
    }

    function disableKeyRotation(address identity, address actor) internal onlyController(identity, actor) {
        configs[identity].automaticRotation = false;
    }

    function addController(address identity, address controller) external override {
        addController(identity, msg.sender, controller);
    }

    function removeController(address identity, address controller) external override {
        removeController(identity, msg.sender, controller);
    }

    function changeController(address identity, address newController) external override {
        changeController(identity, msg.sender, newController);
    }

    function changeControllerSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, address newController) external override {
        bytes32 hash = keccak256(abi.encodePacked(byte(0x19), byte(0), this, nonce[identityController(identity)], identity, "changeController", newController));
        changeController(identity, checkSignature(identity, sigV, sigR, sigS, hash), newController);
    }

    function setAttribute(address identity, address actor, bytes memory name, bytes memory value, uint validity) internal onlyController(identity, actor) {
        emit DIDAttributeChanged(identity, name, value, block.timestamp + validity, changed[identity]);
        changed[identity] = block.number;
    }

    function setAttribute(address identity, bytes memory name, bytes memory value, uint validity) external override {
        setAttribute(identity, msg.sender, name, value, validity);
    }

    function setAttributeSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes memory name, bytes memory value, uint validity) external override {
        bytes32 hash = keccak256(abi.encodePacked(byte(0x19), byte(0), this, nonce[identityController(identity)], identity, "setAttribute", name, value, validity));
        setAttribute(identity, checkSignature(identity, sigV, sigR, sigS, hash), name, value, validity);
    }

    function revokeAttribute(address identity, address actor, bytes memory name, bytes memory value) internal onlyController(identity, actor) {
        emit DIDAttributeChanged(identity, name, value, 0, changed[identity]);
        changed[identity] = block.number;
    }

    function revokeAttribute(address identity, bytes memory name, bytes memory value) external override {
        revokeAttribute(identity, msg.sender, name, value);
    }

    function revokeAttributeSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes memory name, bytes memory value) external override {
        bytes32 hash = keccak256(abi.encodePacked(byte(0x19), byte(0), this, nonce[identityController(identity)], identity, "revokeAttribute", name, value));
        revokeAttribute(identity, checkSignature(identity, sigV, sigR, sigS, hash), name, value);
    }

    function enableKeyRotation(address identity, uint keyRotationTime) external override {
        enableKeyRotation(identity, msg.sender, keyRotationTime);
    }

    function disableKeyRotation(address identity) external override {
        disableKeyRotation(identity, msg.sender);
    }

}