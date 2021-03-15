# LACChain DID Method

[DID Specification](http://dev.lacchain.net/en/ssi/lacchain-did) | [ERC-1056](https://github.com/ethereum/EIPs/issues/1056)

This library is based on [ERC-1056](https://github.com/ethereum/EIPs/issues/1056) and is intended to use Ethereum addresses as fully self-managed [Decentralized Identifiers](https://w3c-ccg.github.io/did-spec/#decentralized-identifiers-dids) (DIDs), it allows you to easily create and manage keys for these identities.  
It also lets you sign standards compliant [JSON Web Tokens (JWT)](https://jwt.io).

This library can be used to create a new did identity called "lac".  It allows identities to be represented as an object that can perform actions such as updating its did-document, signing messages, and verifying messages from other dids.

LACChain DID provides a scalable identity method for Ethereum addresses that gives any Ethereum address the ability to collect on-chain and off-chain data. Because this DID method allows any Ethereum key pair to become an identity, it is more scalable and privacy-preserving than smart contract based identity methods.

## DID Registry

This library contains the Ethereum contract code that allows the owner of a lac-did identity to update the attributes that appear in its did-document.  It exposes an API that allows developers to call the contract functions using Javascript.

Use this if you want to interact directly with a deployed registry contract directly, or deploy a copy of the contract to another Ethereum network.

A DID is an [Identifier](https://w3c-ccg.github.io/did-spec/#decentralized-identifiers-dids) that allows you to lookup a [DID document](https://w3c-ccg.github.io/did-spec/#did-documents) that can be used to authenticate you and messages created by you.

It's designed for resolving public keys for off-chain authentication—where the public key resolution is handled by using decentralized technology.

This contract allows Ethereum addresses to present signing information about themselves with no prior registration. It allows them to perform key rotation and specify different keys and services that are used on its behalf for both on and off-chain usage.

### Contract Deployment

First run,

```bash
$ scripts/generateDeployTxs.js
```

You will get the data needed to deploy as an output from this command. Copy the `senderAddress` and send `cost` amount of ether to that address on the Ethereum network you wish to deploy to. Once this tx is confirmed, simply send the `rawTx` to the same network. `contractAddress` is the address of the deployed contract. This will be the same on all networks it's deployed to.

### Testing the Contracts

Make sure you have truffle installed, then run:

```bash
$ truffle test
```

### Testing the NodeJS library

Make sure you have truffle installed, then run:

```bash
$ npm test
```

Copyright 2021 LACChain

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.