import { keccak256 } from "ethers/lib/utils.js";
import DID from "../did.js";
import * as ethers from "ethers";
import base58 from "bs58";
import lacchain from "@lacchain/gas-model-provider";
import DIDRegistryContractGM from "./DIDRegistryRecoverableGM-270-RC1-1f3dc10f.json"  assert { type: 'json'};
import DIDRegistryContract from "./DIDRegistry.json"  assert { type: 'json'};
import { getResolver } from "./resolver.js";
import Lac1DIDRegistry from "./lac1registry.js";
import basex from "base-x";
import { LAC1_DID_TYPE_CODE, LAC1_DID_METHOD_NAME } from "./constants.js";
export const hex = basex("0123456789abcdef");
export default class DIDLac1 extends DID {
  constructor(config) {
    super(config);
  }

  static async new(config) {
    const didLac1 = new DIDLac1(config);
    await didLac1.init(config);
    return didLac1;
  }

  async init(config) {
    // obtain chainId from network
    const rpcUrl = config.rpcUrl;
    const chainId = config.chainId;
    const registry = config.registry;
    const nodeAddress = config.nodeAddress;

    // 1. validate ChainId matches with the passed provider
    let provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    if (nodeAddress) provider = new lacchain.GasModelProvider(rpcUrl);
    const retrievedChainId = (await provider.getNetwork()).chainId;
    if (retrievedChainId !== chainId)
      // just to ensure that the chain is the intended one
      throw new Error(
        "Retrieved chainId does not match chain",
        retrievedChainId,
        chainId
      );
    this.chainId = retrievedChainId.toString(16);

    // 2. validate registry contract version
    const registryInstance = new ethers.Contract(
      registry,
      config.nodeAddress ? DIDRegistryContractGM.abi : DIDRegistryContract.abi, // TODO: select abi according to a contract being used ~~~
      provider
    );

    const contractVersion = await registryInstance.version();
    const versionNumber = parseInt(contractVersion);
    if (!(versionNumber >= 0 && versionNumber < 256 * 256 - 1)) {
      // two bytes according to specification
      throw new Error("Invalid version number, got: " + versionNumber);
    }

    // set did version
    const c = [(versionNumber >> 8) & 255, versionNumber & 255];
    const b = Buffer.from(c);
    this.didVersion = b.toString("hex");

    this.registry = new Lac1DIDRegistry(config);
    this.resolver = getResolver({
      ...config,
      networks: [
        {
          registry: config.registry,
          rpcUrl: config.rpcUrl,
          chainId: config.chainId,
        },
      ],
    });
  }

  /**
   * Returns the did of the current initialized params
   */
  get id() {
    return (
      "did:" +
      LAC1_DID_METHOD_NAME +
      ":" +
      DIDLac1.encode(
        LAC1_DID_TYPE_CODE,
        this.chainId,
        this.address,
        this.config.registry,
        this.didVersion
      )
    );
  }

  static checksum(payload) {
    const trimmed = Buffer.from(
      keccak256(Buffer.concat(payload)).replace("0x", ""),
      "hex"
    ).subarray(0, 4);
    return Buffer.from(trimmed);
  }

  static encode(didType, chainId, address, didRegistry, didVersion) {
    const payload = [
      Buffer.from(
        didVersion.startsWith("0x") ? didVersion.slice(2) : didVersion,
        "hex"
      ),
      Buffer.from(didType.startsWith("0x") ? didType.slice(2) : didType, "hex"),
      DIDLac1.getLacchainDataBuffer(chainId, address, didRegistry),
    ];
    payload.push(DIDLac1.checksum(payload));
    return base58.encode(Buffer.concat(payload));
  }

  static getLacchainDataBuffer(chainId, address, didRegistry) {
    const dataArr = [
      Buffer.from(address.slice(2), "hex"),
      Buffer.from(didRegistry.slice(2), "hex"),
      hex.decode(chainId.startsWith("0x") ? chainId.slice(2) : chainId, "hex"),
    ];
    return Buffer.concat(dataArr);
  }

  static decodeDid(did) {
    const trimmed = did.replace("did:lac1:", "");
    const data = Buffer.from(base58.decode(trimmed));
    const len = data.length;
    const encodedPayload = Buffer.from(data.subarray(0, len - 4));
    const computedChecksum = DIDLac1.checksum([encodedPayload]);
    const checksum = Buffer.from(data.subarray(len - 4, len));
    if (!computedChecksum.equals(checksum)) {
      const message = "Checksum mismatch";
      throw new Error(message);
    }
    const version = Buffer.from(data.subarray(0, 2)).toString("hex");
    const didType = Buffer.from(data.subarray(2, 4)).toString("hex");
    // TODO handle better versioning
    if (didType !== LAC1_DID_TYPE_CODE) {
      const message = "Unsupported did type";
      throw new Error(message);
    }
    const address = ethers.utils.getAddress(
      "0x" + Buffer.from(data.subarray(4, 24)).toString("hex")
    );
    const didRegistryAddress = ethers.utils.getAddress(
      "0x" + Buffer.from(data.subarray(24, 44)).toString("hex")
    );
    let c = Buffer.from(data.subarray(44, len - 4)).toString("hex");
    if (c[0] === "0") {
      c = c.substring(1);
    }
    const chainId = "0x" + c;
    return {
      address,
      didMethod: LAC1_DID_METHOD_NAME,
      didRegistryAddress,
      chainId,
      version,
      didType,
    };
  }

  async getDocument() {
    if (!this.config.network)
      throw new Error(
        "You must specify the network to resolve the DID document"
      );
    const did = this.id;
    return await this.resolver.lac1(did);
  }

  async changeController(controller) {
    if (this.readOnly)
      throw new Error("Cannot change controller to a read-only DID");
    const tx = await this.registry.rotateMainController(
      this.address,
      controller
    );
    return await tx.wait();
  }

  async changeControllerSigned(controllerPrivateKey, controller) {
    if (this.readOnly)
      throw new Error("Cannot change controller to a read-only DID");
    const tx = await this.registry.rotateMainControllerSigned(
      this.address,
      controllerPrivateKey,
      controller
    );
    return await tx.wait();
  }

  async revokeVerificationMethod(vm) {
    if (this.readOnly)
      throw new Error("Cannot revoke verification method to a read-only DID");
    const tx = await this.registry.revokeAttribute(
      this.address,
      `${vm.type}/${vm.controller}/${vm.algorithm}/${vm.encoding}`,
      vm.publicKey,
      vm.revokeDeltaTimeSeconds,
      vm.compromised
    );
    return await tx.wait();
  }

  async addAKAId(id, validity) {
    if (this.readOnly)
      throw new Error("Cannot add alsoKnownAs element to a read-only DID");
    const tx = await this.registry.addAKAIdentifier(this.address, id, validity);
    return await tx.wait();
  }
  async removeAKAId(id) {
    if (this.readOnly)
      throw new Error("Cannot remove alsoKnownAs element to a read-only DID");
    const tx = await this.registry.removeAKAIdentifier(this.address, id);
    return await tx.wait();
  }
}
