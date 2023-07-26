import * as ethers from "ethers";
import DIDRegistryContractGM from "./DIDRegistryGM.json";
import lacchain from "@lacchain/gas-model-provider";
import { wrapDidDocument } from "../resolver.js";
import DIDLac1 from "./lac1Did.js";

export function getResolver(config = {}) {
  const iface = new ethers.utils.Interface(DIDRegistryContractGM.abi);

  async function changeLog(identity, registry) {
    const history = [];
    let previousChange = await registry.changed(identity);
    const controller = previousChange
      ? await registry.identityController(identity)
      : identity;
    while (previousChange) {
      const blockNumber = previousChange;
      const logs = await registry.queryFilter(
        {
          address: config.registry,
          topics: [null, `0x000000000000000000000000${identity.slice(2)}`],
        },
        previousChange.toNumber(),
        previousChange.toNumber()
      );
      previousChange = undefined;
      for (const log of logs) {
        const event = iface.parseLog(log);
        history.unshift({ ...event, hash: log.transactionHash });
        if (event.args.previousChange.lt(blockNumber)) {
          previousChange = event.args.previousChange;
        }
      }
    }
    return { controller, history };
  }

  async function resolve(did) {
    let decodedDid;
    try {
      decodedDid = DIDLac1.decodeDid(did);
    } catch (e) {
      throw new Error("Invalid DID");
    }
    const network = config.networks.find(
      (net) => net.chainId === parseInt(decodedDid.chainId.substring(2), 16)
    );
    if (!network) throw new Error(`No available network for the passed did`);
    let provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
    if (network.nodeAddress)
      provider = new lacchain.GasModelProvider(network.rpcUrl);
    const registry = new ethers.Contract(
      decodedDid.didRegistryAddress,
      DIDRegistryContractGM.abi,
      provider
    );

    const { controller, history } = await changeLog(
      decodedDid.address,
      registry
    );
    const encodedController = DIDLac1.encode(
      DIDLac1.didType,
      decodedDid.chainId,
      controller,
      decodedDid.didRegistryAddress,
      decodedDid.version // TODO: check side effects of assuming same version for both the main identity and controller did
    );
    return wrapDidDocument(
      did,
      decodedDid.address,
      `did:lac1:${encodedController}`,
      history,
      config.mode
    );
  }

  return { lac1: resolve };
}
