import * as ethers from "ethers";
import DIDRegistry from "../registry.js";
import { attributeToHex, stringToBytes } from "../utils.js";
import DIDRegistryContractGM from "./DIDRegistryGM.json";
import DIDRegistryContract from "./DIDRegistry.json";

export default class Lac1DIDRegistry extends DIDRegistry {
  constructor(conf = {}) {
    super(conf);
    this.registry = new ethers.Contract(
      conf.registry,
      conf.nodeAddress ? DIDRegistryContractGM.abi : DIDRegistryContract.abi,
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
}
