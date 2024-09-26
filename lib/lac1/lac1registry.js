import * as ethers from "ethers";
import DIDRegistry from "../registry.js";
import {
  attributeToHex,
  stripHexPrefix,
  stringToBytes,
  signData,
} from "../utils.js";
import DIDRegistryContractGM from "./DIDRegistryRecoverableGM-270-RC1-1f3dc10f.json"  assert { type: 'json'};
import DIDRegistryContract from "./DIDRegistry.json"  assert { type: 'json'};
export default class Lac1DIDRegistry extends DIDRegistry {
  constructor(conf = {}) {
    super(conf);
    this.registry = new ethers.Contract(
      conf.registry,
      conf.nodeAddress ? DIDRegistryContractGM.abi : DIDRegistryContract.abi, // TODO: Update DID Reg for no-gas-model network
      this.provider
    );
  }

  async revokeAttribute(
    address,
    key,
    value,
    revokeDeltaTimeSeconds,
    compromised = false
  ) {
    return this.registry.revokeAttribute(
      address,
      stringToBytes(key),
      attributeToHex(key, value),
      revokeDeltaTimeSeconds,
      compromised,
      {
        gasLimit: 1000000,
        gasPrice: 0,
      }
    );
  }

  rotateMainController(address, newController) {
    return this.registry.rotateMainController(address, newController, {
      gasLimit: 1000000,
      gasPrice: 0,
    });
  }

  async rotateMainControllerSigned(
    address,
    controllerPrivateKey,
    newController
  ) {
    const nonce = await this.registry.nonce(newController);
    const sig = await signData(
      address,
      controllerPrivateKey,
      Buffer.from("rotateMainController").toString("hex") +
        stripHexPrefix(newController),
      nonce.toNumber(),
      this.conf.registry
    );
    return await this.registry.rotateMainControllerSigned(
      address,
      sig.v,
      sig.r,
      sig.s,
      newController,
      {
        gasLimit: 1000000,
        gasPrice: 0,
      }
    );
  }

  async addAKAIdentifier(address, id, validity) {
    return this.registry.addAKAIdentifier(address, id, validity, {
      gasLimit: 1000000,
      gasPrice: 0,
    }); // TODO: generalize  for non gas model networks
  }

  async removeAKAIdentifier(address, id) {
    return this.registry.removeAKAIdentifier(address, id, {
      gasLimit: 1000000,
      gasPrice: 0,
    }); // TODO: generalize  for non gas model networks
  }
}
