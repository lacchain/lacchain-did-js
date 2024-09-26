import bs58 from "bs58";
import * as ethers from "ethers";
import DIDRegistryContract from "./DIDRegistry.json"  assert { type: 'json'};
import DIDDocument from "./document.js";
import { bytes32toString, keyAlgorithms, parseDID } from "./utils.js";
import lacchain from "@lacchain/gas-model-provider";

const { BigNumber } = ethers;

export function getVerificationMethod(
  did,
  index,
  algo,
  encoding,
  value,
  controller
) {
  const verificationMethod = {
    id: `${did}#vm-${index}`,
    type: `${keyAlgorithms[algo]}`,
    controller,
  };
  switch (encoding) {
    case null:
    case undefined:
    case "hex":
      verificationMethod.publicKeyHex = value.slice(2);
      break;
    case "blockchain":
      verificationMethod.blockchainAccountId = value;
      break;
    case "base64":
      verificationMethod.publicKeyBase64 = Buffer.from(
        value.slice(2),
        "hex"
      ).toString("base64");
      break;
    case "base58":
      verificationMethod.publicKeyBase58 = bs58.encode(
        Buffer.from(value.slice(2), "hex")
      );
      break;
    case "pem":
      verificationMethod.publicKeyPem = Buffer.from(
        value.slice(2),
        "hex"
      ).toString();
      break;
    case "json":
      verificationMethod.publicKeyJwk = JSON.parse(
        Buffer.from(value.slice(2), "hex").toString()
      );
      break;
  }
  return verificationMethod;
}

export function wrapDidDocument(did, controller, history, mode) {
  const now = BigNumber.from(Math.floor(new Date().getTime() / 1000));
  const defaultVerificationMethod = [];

  const authentication = [];

  let index = -1;
  const relationships = {
    auth: {},
    asse: {},
    keya: {},
    dele: {},
    invo: {},
  };
  const verificationMethods = {};
  const services = {};

  for (const event of history) {
    const validTo = event.args.validTo;
    const key = `${event.name}-${event.args.name}-${event.args.value}`;
    const value = event.args.value;
    if (validTo && validTo.gte(now)) {
      if (event.name !== "DIDAttributeChanged") continue;
      const name = bytes32toString(event.args.name);
      const match = name.match(
        /(vm|auth|asse|keya|dele|invo|svc)\/(.+)?\/(\w+)?\/(\w+)?$/
      );
      if (!match) continue;
      const type = match[1];
      const controller = match[2];
      const algo = match[3];
      const encoding = match[4];
      switch (type) {
        case "vm":
          index++;
          verificationMethods[key] = getVerificationMethod(
            did,
            index,
            algo,
            encoding,
            value,
            controller
          );
          break;
        case "auth":
        case "asse":
        case "keya":
        case "dele":
        case "invo":
          if (!algo && !encoding) {
            relationships[type][key] = Buffer.from(
              value.slice(2),
              "hex"
            ).toString();
            continue;
          }
          index++;
          verificationMethods[key] = getVerificationMethod(
            did,
            index,
            algo,
            encoding,
            value,
            controller
          );
          relationships[type][key] = verificationMethods[key].id;
          break;
        case "svc":
          services[key] = {
            type: algo,
            serviceEndpoint: Buffer.from(
              event.args.value.slice(2),
              "hex"
            ).toString(),
          };
          break;
      }
    } else {
      const name = event.args.name
        ? bytes32toString(event.args.name)
        : event.args.name;
      if (
        index > 0 &&
        event.name === "DIDAttributeChanged" &&
        name.match(
          /(vm|auth|asse|keya|dele|invo|svc)\/(\w+)?\/(\w+)?\/(\w+)?$/
        ) &&
        validTo.lt(now)
      ) {
        index--;
      }
      delete relationships.auth[key];
      delete relationships.asse[key];
      delete relationships.keya[key];
      delete relationships.dele[key];
      delete relationships.invo[key];
      delete verificationMethods[key];
      delete services[key];
    }
  }

  const doc = {
    "@context": [
      "https://w3id.org/did/v1",
      "https://w3id.org/security/suites/jws-2020/v1",
    ],
    id: did,
    controller,
    verificationMethod: defaultVerificationMethod.concat(
      Object.values(verificationMethods)
    ),
    authentication: authentication.concat(Object.values(relationships.auth)),
    assertionMethod: authentication.concat(Object.values(relationships.asse)),
    keyAgreement: authentication.concat(Object.values(relationships.keya)),
    capabilityInvocation: authentication.concat(
      Object.values(relationships.invo)
    ),
    capabilityDelegation: authentication.concat(
      Object.values(relationships.dele)
    ),
  };
  if (Object.values(services).length > 0) {
    doc.service = Object.values(services);
  }

  return new DIDDocument(doc, mode);
}

export function getResolver(config = {}) {
  const iface = new ethers.utils.Interface(DIDRegistryContract.abi);

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
    const parsed = parseDID(did);
    const fullId = parsed.id.match(/^(.*)?(0x[0-9a-fA-F]{40})$/);
    if (!fullId) throw new Error(`Not a valid ethr DID: ${did}`);
    const id = fullId[2];

    const network = config.networks.find((net) => net.name === parsed.network);
    if (!network) throw new Error(`No config for networkId: ${parsed.network}`);

    let provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
    if (network.nodeAddress)
      provider = new lacchain.GasModelProvider(network.rpcUrl);
    const registry = new ethers.Contract(
      network.registry,
      DIDRegistryContract.abi,
      provider
    );

    const { controller, history } = await changeLog(id, registry);
    return wrapDidDocument(
      did,
      `did:lac:${parsed.network}:${controller.toLowerCase()}`,
      history,
      config.mode
    );
  }

  return { lac: resolve };
}
