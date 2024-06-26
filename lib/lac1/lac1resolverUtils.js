import bs58 from "bs58";
import * as ethers from "ethers";
import DIDDocument from "../document.js";
import { bytes32toString, keyAlgorithms } from "../utils.js";
import { keccak256 } from "ethers/lib/utils.js";

const { BigNumber } = ethers;

export function processVerificationMethodIdForAttribute(prefix, valueInHex) {
  const valueArrayBuffer = Buffer.from(valueInHex.replace("0x", ""), "hex");
  const prefixBuffer = Buffer.from(prefix, "utf-8");
  const finalBuffer = Buffer.concat([prefixBuffer, valueArrayBuffer]);
  const digest = keccak256(finalBuffer);
  const bufferDigest = Buffer.from(digest.replace("0x", ""), "hex");
  const base58Identifier = bs58.encode(bufferDigest);
  return base58Identifier;
}

export function getVerificationMethod(did, algo, encoding, value, controller) {
  const id = processVerificationMethodIdForAttribute(controller, value);
  const verificationMethod = {
    id: `${did}#${id}`,
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

export function processValidVerificationMethod(
  did,
  event,
  verificationMethods,
  services,
  relationships,
  value,
  key
) {
  const name = bytes32toString(event.args.name);
  const match = name.match(
    /(vm|auth|asse|keya|dele|invo|svc)\/(.+)?\/(\w+)?\/(\w+)?$/
  );
  if (!match) return;
  const type = match[1];
  const controller = match[2];
  const algo = match[3];
  const encoding = match[4];
  switch (type) {
    case "vm":
      verificationMethods[key] = getVerificationMethod(
        did,
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
        return;
      }
      verificationMethods[key] = getVerificationMethod(
        did,
        algo,
        encoding,
        value,
        controller
      );
      relationships[type][key] = verificationMethods[key].id;
      break;
    case "svc":
      services[key] = {
        id: processVerificationMethodIdForAttribute(type, value),
        type: algo,
        serviceEndpoint: Buffer.from(
          event.args.value.slice(2),
          "hex"
        ).toString(),
      };
      break;
  }
}

export function handleVerificationMethodRemoval(
  relationships,
  verificationMethods,
  services,
  key
) {
  delete relationships.auth[key];
  delete relationships.asse[key];
  delete relationships.keya[key];
  delete relationships.dele[key];
  delete relationships.invo[key];
  delete verificationMethods[key];
  delete services[key];
}

export function processAKAEventsOnAddingAnElement(id, alsoKnownAs) {
  const idx = alsoKnownAs.indexOf(id);
  if (idx < 0) {
    alsoKnownAs.push(id);
  }
}

export function processAKAEventsOnRemovingElement(id, alsoKnownAs) {
  const idx = alsoKnownAs.indexOf(id);
  if (idx > -1) {
    alsoKnownAs.splice(idx, 1);
  }
}

export function wrapDidDocument(
  did,
  caip10ControllerFormat,
  controller,
  history,
  mode
) {
  const now = BigNumber.from(Math.floor(new Date().getTime() / 1000));
  const defaultVerificationMethod = {
    id: `${did}#controller`,
    type: "EcdsaSecp256k1RecoveryMethod2020",
    controller: `${did}`,
    blockchainAccountId: caip10ControllerFormat,
  };
  const relationships = {
    auth: {},
    asse: {},
    keya: {},
    dele: {},
    invo: {},
  };
  const verificationMethods = {};
  const services = {};
  const alsoKnownAs = [];
  for (const event of history) {
    const validTo = event.args.validTo;
    const key = `${event.name}-${event.args.name}-${event.args.value}`;
    const value = event.args.value;
    if (validTo && validTo.gte(now)) {
      if (event.name == "DIDAttributeChanged") {
        processValidVerificationMethod(
          did,
          event,
          verificationMethods,
          services,
          relationships,
          value,
          key
        );
      } else if (event.name == "AKAChanged") {
        const id = event.args.akaId;
        processAKAEventsOnAddingAnElement(id, alsoKnownAs);
      }
    } else {
      if (event.name == "DIDAttributeChanged") {
        handleVerificationMethodRemoval(
          relationships,
          verificationMethods,
          services,
          key
        );
      } else if (event.name == "AKAChanged") {
        const id = event.args.akaId;
        processAKAEventsOnRemovingElement(id, alsoKnownAs);
      }
    }
  }

  const doc = {
    "@context": [
      "https://w3id.org/did/v1",
      "https://w3id.org/security/suites/jws-2020/v1",
    ],
    id: did,
    alsoKnownAs,
    controller,
    verificationMethod: [defaultVerificationMethod].concat(
      Object.values(verificationMethods)
    ),
    authentication: []
      .concat([defaultVerificationMethod.id])
      .concat(Object.values(relationships.auth)),
    assertionMethod: []
      .concat([defaultVerificationMethod.id])
      .concat(Object.values(relationships.asse)),
    keyAgreement: [].concat(Object.values(relationships.keya)),
    capabilityInvocation: [].concat(Object.values(relationships.invo)),
    capabilityDelegation: [].concat(Object.values(relationships.dele)),
  };

  if (Object.values(services).length > 0) {
    doc.service = Object.values(services);
  }

  if (alsoKnownAs.length == 0) delete doc.alsoKnownAs;

  return new DIDDocument(doc, mode);
}
