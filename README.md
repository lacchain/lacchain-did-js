# LACChain DID Method NodeJS Library

[DID Specification](http://dev.lacchain.net/en/did-method) | [DID Registry Contracts](http://github.com/lacchain/lacchain-did-registry)

This library is an implementation of LACChain DID Method in NodeJS. 
It provides the necessary methods and functions to interact with a DID and resolve a DID Document without the need to directly call the smart contracts.

## Pre-requisites

- NodeJS  > 16.20 or above

## Usage

Just install the package from NPM repository.

```bash
npm install @lacchain/did
```

And import it in your NodeJS project.
```javascript
import { DID, DIDRecoverable, Resolver } from '@lacchain/did'
```

 - The ``DID(config={})`` and ``DIDRecoverable(config={})`` classes can be used to create and update a DID Document.
   Where **config** is an object that can have the following properties:
   
|    Name   |   Type   | Required |         Description           |
|-----------|----------|----------|-------------------------------|
| registry  |  String  |   true   | The address of DID Registry   |
| rpcUrl    |  String  |   true   | The URL of Ethereum RPC API   |
| network   |  String  |   true   | The name of the network (ie: main, test)  |
| address   |  String  |   false   | The address of a DID. If this is set a read-only LACChainDID Object will be created unless you provide controllerPrivateKey property  |
| controllerPrivateKey   |  String  |   false   | The private key of the DID address. If you set the controller private key you must also provide the DID address  |

If you don't provide the ``address`` and ``controllerPrivateKey``, the class will generate one automatically.

 - The ``Resolver(config={})`` class can be used to resolve a DID Document from the DID identifier.

   Where **config** is an object that can have the following properties:

|    Name   |   Type   | Required |         Description           |
|-----------|----------|----------|-------------------------------|
| networks  |  Array   |   true   | An array of network config objects to use for resolving DID Document, where each item is an object with the following properties: <br /> - **name:** The network name <br /> - **registry:** The address of DID Registry <br /> - **rpcUrl:** The URL of Ethereum RPC API <br />| 
| mode      |  String  |   false  | The resolving DID Document mechanism: explicit, implicit (default)   |


### 1. Create a new DID

Depending on the functionalities that you want to use, there are two types of classes to operate a DID

 - **Regular DID**: It is the basic DID that allows multiple controllers and automatic key rotation.

```javascript
const did = new DID( {
   registry: '0xbDa1238272FDA6888556449Cb77A87Fc8205E8ba',
   rpcUrl: 'https://writer.lacchain.net',
   network: 'main'
} );
```
- **Recoverable DID**: It is the advanced DID that allows, in addition to the functions of a basic DID, key recovery.
```javascript
const did = new DIDRecoverable( {
   registry: '0xbDa1238272FDA6888556449Cb77A87Fc8205E8ba',
   rpcUrl: 'https://writer.lacchain.net',
   network: 'main'
} );
```

#### LAC-NET Gas Model

If you are planning to interact with the LACChain / LACNET Gas Model, just specify the **nodeAddress** & **expiration** parameters in the config object:

```javascript
const did = new DID( {
   registry: '0xB9D96a0bDd52FE48fC504d0BB28AF51091275C81',
   rpcUrl: 'http://34.69.22.82',
   nodeAddress: '0xd00e6624a73f88b39f82ab34e8bf2b4d226fd768',
   expiration: 1736394529,
   network: 'main'
} );
```

Or,

```javascript
const did = new DIDRecoverable( {
   registry: '0xB9D96a0bDd52FE48fC504d0BB28AF51091275C81',
   rpcUrl: 'http://34.69.22.82',
   nodeAddress: '0xd00e6624a73f88b39f82ab34e8bf2b4d226fd768',
   expiration: 1736394529,
   network: 'main'
} );
```

**Note:** Use the same parameters in the ```resolver``` class

The basic properties of a DID are:

```javascript
console.log( did.id ); // did:lac:main:0x47adc0faa4f6eb42b499187317949ed99e77ee85
console.log( did.address ); // 0x47adc0faa4f6eb42b499187317949ed99e77ee85
```

### 2. Add / remove a new controller

Before change to another controller, it is necessarily to add it first by invoking the next function:

```javascript
await did.addController( '0x4a5a6460d00c4d8c2835a3067f53fb42021d5bb9' );
```

It is also possible to remove an extra controller registered with two conditions:

1. The controller to remove cannot be the current controller
2. Must remain at least one controller

```javascript
await did.removeController( '0x4a5a6460d00c4d8c2835a3067f53fb42021d5bb9' );
```

### 3. Change the current controller

Once the new controller has been registered, it can be changed by invoking the following function:

```javascript
await did.changeController( '0x4a5a6460d00c4d8c2835a3067f53fb42021d5bb9' );
```

The current controller is the only one that has the permissions to execute changes on the DID (there can only be one current controller), that is why when changing the controller, it is necessary to specify to the DID class which is the controller's private key to that can continue to sign transactions to the network.
To specify the private key of current controller, just call the next function:

```javascript
await did.setControllerKey( PRIVATE_KEY_HEX );
```

***Note**: The private key must be in hex format without 0x prefix.* 

### 4. Get the current controller

To get the current active controller, just call:

```javascript
const currentController = await did.getController(); // 0x4a5a6460d00c4d8c2835a3067f53fb42021d5bb9
```

### 5. Get all registered controllers

The function to get all the controllers registered for the DID will return an array of controllers addresses:

```javascript
const controllers = await did.getController(); // ['0x47adc0faa4f6eb42b499187317949ed99e77ee85', '0x4a5a6460d00c4d8c2835a3067f53fb42021d5bb9']
```


### 6. Add a new Verification Method
According to the W3C specification, it is possible to add Verification Methods to a DID that have a general purpose, for this it is enough to invoke the following function:

```javascript
await did.addVerificationMethod({
   type: 'vm',
   algorithm: 'esecp256k1rm',
   encoding: 'hex',
   publicKey: PUBLIC_KEY_HEX,
   controller: PUBLIC_KEY_CONTROLLER,
   expiration: 31536000 // default: 31536000
});
```

Where **type** can  (according to the [W3C DID Verification Relationships](https://www.w3.org/TR/did-core/#verification-relationships)):
- **vm**: Generic Verification Method
- **auth**: Authentication Method
- **asse**: Assertion Method
- **keya**: Key Agreement
- **dele**: Delegation Capability
- **invo**: Invocation Capability

And **algorithm** can be (see [W3C DID Verification Method Types](https://www.w3.org/TR/did-spec-registries/#verification-method-types)):
- **jwk**: JsonWebKey2020,
- **esecp256k1vk**: EcdsaSecp256k1VerificationKey2019,
- **esecp256k1rm**: EcdsaSecp256k1RecoveryMethod2020,
- **edd25519vk**: Ed25519VerificationKey2018,
- **gpgvk**: GpgVerificationKey2020,
- **rsavk**: RsaVerificationKey2018,
- **x25519ka**: X25519KeyAgreementKey2019,
- **ssecp256k1vk**: SchnorrSecp256k1VerificationKey2019

And **encoding** support the following formats (according to the [W3C DID Verification Method Properties](https://www.w3.org/TR/did-spec-registries/#verification-method-properties)):
- **hex**: Hexadecimal
- **base64**: Base 64
- **base58**: Base 58

The **publicKey** represents the Public Key itself in the **encoding** format specified. 

And the **controller** must be the Public Key Controller (String), usually a DID. Can be even of other DID method.

The **expiration** is the expiration time (in seconds) ahead of current time. This field is optional, and the default expiration time is: 31536000 

#### Verification Relationships

In order to facilitate the registration of Verification Methods according to the type of Relationship, it is possible to use specific functions for this purpose.

- To add an Authentication Method
```javascript
await did.addAuthenticationMethod( {
   algorithm: 'esecp256k1rm',
   encoding: 'hex',
   publicKey: PUBLIC_KEY_HEX,
   controller: PUBLIC_KEY_CONTROLLER
} );
```

- To add an Assertion Method
```javascript
await did.addAssertionMethod( {
   algorithm: 'esecp256k1rm',
   encoding: 'hex',
   publicKey: PUBLIC_KEY_HEX,
   controller: PUBLIC_KEY_CONTROLLER
} );
```

- To add a Key Agreement
```javascript
await did.addKeyAgreement( {
   algorithm: 'x25519ka',
   encoding: 'hex',
   publicKey: PUBLIC_KEY_HEX,
   controller: PUBLIC_KEY_CONTROLLER
} );
```

- To add a Delegation Capability
```javascript
await did.addCapabilityDelegation( {
   algorithm: 'edd25519vk',
   encoding: 'hex',
   publicKey: PUBLIC_KEY_HEX,
   controller: PUBLIC_KEY_CONTROLLER
} );
```

- To add an Invocation Capability
```javascript
await did.addCapabilityInvocation( {
   algorithm: 'edd25519vk',
   encoding: 'hex',
   publicKey: PUBLIC_KEY_HEX,
   controller: PUBLIC_KEY_CONTROLLER
} );
```

### 5. Bind an existing Verification Method

It is also possible to have a Verification Method (VM) associated with more than one relationship, that is why once a VM is registered it is possible to bind it to a specific relationship using the VM id.

Depending on the relationship it is possible to bind a VM:

- To bind an Authentication Method
```javascript
await did.bindAuthenticationMethod( VERIFICATION_METHOD_ID );
```
- To bind an Assertion Method
```javascript
await did.bindAssertionMethod( VERIFICATION_METHOD_ID );
```
- To bind a Key Agreement
```javascript
await did.bindKeyAgreement( VERIFICATION_METHOD_ID );
```
- To bind a Delegation Capability
```javascript
await did.bindCapabilityDelegation( VERIFICATION_METHOD_ID );
```
- To bind an Invocation Capability
```javascript
await did.bindCapabilityInvocation( VERIFICATION_METHOD_ID );
```

### 6. Revoke a Verification Method

All VMs have an expiration time, however, it is possible to revoke them early using the following function:

```javascript
await did.revokeVerificationMethod( {
   type: 'vm',
   algorithm: 'esecp256k1rm',
   encoding: 'hex',
   publicKey: PUBLIC_KEY_HEX,
   controller: PUBLIC_KEY_CONTROLLER
} );
```

It is important to provide all properties of the VM to revoke (except the expiration time), that is because they conform the key of the VM. 

### 7. Add a Service

To add a Service to the DID, just provide the **type** and **endpoint** fields as Strings. 

```javascript
await did.addService( {
   type: 'mailbox',
   endpoint: 'https://mailbox.lacchain.net'
} );
```

### 9. Enable / Disable Automatic Key Rotation

To enable Automatic Key Rotation functionality, it is necessarily to comply with the following condition:
- Add at least el minimum number of controllers specified in the DID Registry
- The key rotation time (in seconds) must be greater or equal that the minimum rotation time specified in the DID Registry

```javascript
await did.enableKeyRotation( ROTATION_TIME_SECONDS );
```

To disable this functionality, just call:

```javascript
await did.disableKeyRotation();
```

### 10. Recover the DID control
This functionality will only be available if the **DIDRecoverable** class is instantiated and also the registry points to the Smart Contract that supports it.

```javascript
await did.recover( CONTROLLER_ADDRESS, CONTROLLER_PRIVATE_KEY );
```

Where:

- CONTROLLER_ADDRESS: The controller address that you will prove ownership (Needs to be previously registered in the DID)
- CONTROLLER_PRIVATE_KEY: Is the controller private key that you will prove ownership (in hex format without 0x prefix)

***Note:** The **recover** function needs to be called ``n/2 + 1`` times.*

## Testing

The unit test will be performed in the LACChain Main Network. If you want to change that, edit directly the files in the /test directory 

```bash
$ npm install
$ npm test
```
