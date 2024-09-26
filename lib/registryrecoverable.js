import DIDRegistry from "./registry.js";
import * as ethers from "ethers";
import DIDRegistryRecoverableContract from "./DIDRegistryRecoverable.json"  assert { type: 'json'};

export default class DIDRegistryRecoverable extends DIDRegistry {
  constructor(conf = {}) {
    super(conf);
    const provider = this.configureProvider(conf);
    this.registry = new ethers.Contract(
      conf.registry,
      DIDRegistryRecoverableContract.abi,
      provider
    );
  }

  recover(address, signature, controller) {
    return this.registry.recover(
      address,
      signature.v,
      signature.r,
      signature.s,
      controller,
      {
        gasLimit: 10000000,
        gasPrice: 0,
      }
    );
  }
}
