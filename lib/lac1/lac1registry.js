import * as ethers from "ethers";
import DIDRegistry from "../registry.js";
import { attributeToHex, stringToBytes } from "../utils.js";
import DIDRegistryContractGM from "./DIDRegistryRecoverableGM-270-RC1-1f3dc10f.json";
import DIDRegistryContract from "./DIDRegistry.json";

export default class Lac1DIDRegistry extends DIDRegistry {
  constructor(conf = {}) {
    super(conf);
    this.registry = new ethers.Contract(
      conf.registry,
      conf.nodeAddress ? DIDRegistryContractGM.abi : DIDRegistryContract.abi,// TODO: Update DID Reg for no-gas-model network
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
  
  async addAKAIdentifier(address, id, validity) {
    return this.registry.addAKAIdentifier(address, id, validity, {gasLimit: 1000000,
      gasPrice: 0,}); // TODO: generalize  for non gas model networks
  }

  async removeAKAIdentifier(address, id) {
    return this.registry.removeAKAIdentifier(address, id, {gasLimit: 1000000,
      gasPrice: 0,}); // TODO: generalize  for non gas model networks
  }
}
