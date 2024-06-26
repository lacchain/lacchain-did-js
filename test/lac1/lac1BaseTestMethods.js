import chai from "chai";
import bs58 from "bs58";
import chaiAsPromised from "chai-as-promised";
import { createKeyPair, sleep } from "../../lib/utils.js";
import { processVerificationMethodIdForAttribute } from "../../lib/lac1/lac1resolverUtils.js";

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

const shouldAddVerificationMethod = async (did) => {
  const veryKey = createKeyPair();
  await did.addVerificationMethod({
    type: "vm",
    algorithm: "esecp256k1rm",
    encoding: "hex",
    publicKey: `0x${veryKey.publicKey}`,
    controller: did.address,
  });
  const document = await did.getDocument();

  expect(document.verificationMethod).to.not.be.null;
  expect(document.verificationMethod).to.have.lengthOf(2); // TODO: Verify why this is not accomplished
  expect(document.verificationMethod[1].publicKeyHex).to.equal(
    veryKey.publicKey
  );
};

const shouldAddAuthenticationMethod = async (did) => {
  const authKey = createKeyPair();
  await did.addAuthenticationMethod({
    algorithm: "esecp256k1rm",
    encoding: "hex",
    publicKey: `0x${authKey.publicKey}`,
    controller: did.address,
  });
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(2);
  expect(document.verificationMethod[1].publicKeyHex).to.equal(
    authKey.publicKey
  );
  expect(document.authentication).to.not.be.null;
  expect(document.authentication).to.have.lengthOf(2);
  expect(document.authentication[1].publicKeyHex).to.equal(authKey.publicKey);
};

const shouldBindAuthenticationMethod = async (did) => {
  const veryKey = createKeyPair();
  const authKey = createKeyPair();
  await did.addVerificationMethod({
    type: "vm",
    algorithm: "esecp256k1rm",
    encoding: "hex",
    publicKey: `0x${veryKey.publicKey}`,
    controller: did.id,
  });
  await did.addAuthenticationMethod({
    algorithm: "esecp256k1rm",
    encoding: "hex",
    publicKey: `0x${authKey.publicKey}`,
    controller: did.id,
  });
  let document = await did.getDocument();

  const vmId = processVerificationMethodIdForAttribute(
    did.id,
    veryKey.publicKey
  );
  await did.bindAuthenticationMethod(`${did.id}#${vmId}`);
  document = await did.getDocument();
  expect(document.verificationMethod).to.have.lengthOf(3);

  expect(document.authentication).to.not.be.null;
  expect(document.authentication).to.have.lengthOf(3);

  expect(document.authentication[2].publicKeyHex).to.equal(veryKey.publicKey); // last added -> last listed in array
};

const shouldAddAssertionMethod = async (did) => {
  const asseKey = createKeyPair();
  const publicKeyBase64 = Buffer.from(asseKey.publicKey, "hex").toString(
    "base64"
  );
  await did.addAssertionMethod({
    algorithm: "esecp256k1vk",
    encoding: "base64",
    publicKey: publicKeyBase64,
    controller: did.address,
  });
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(2);
  expect(document.verificationMethod[1].publicKeyBase64).to.equal(
    publicKeyBase64
  );

  expect(document.assertionMethod).to.not.be.null;
  expect(document.assertionMethod).to.have.lengthOf(2);
  expect(document.assertionMethod[1].publicKeyBase64).to.equal(publicKeyBase64);
};

const shouldBindAssertionMethod = async (did) => {
  const veryKey = createKeyPair();
  const asseKey = createKeyPair();
  await did.addVerificationMethod({
    type: "vm",
    algorithm: "esecp256k1rm",
    encoding: "hex",
    publicKey: `0x${veryKey.publicKey}`,
    controller: did.id,
  });

  const publicKeyBase64 = Buffer.from(asseKey.publicKey, "hex").toString(
    "base64"
  );

  await did.addAssertionMethod({
    algorithm: "esecp256k1vk",
    encoding: "base64",
    publicKey: publicKeyBase64,
    controller: did.id,
  });

  const vmId = processVerificationMethodIdForAttribute(
    did.id,
    veryKey.publicKey
  );

  await did.bindAssertionMethod(`${did.id}#${vmId}`);
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(3);

  expect(document.assertionMethod).to.not.be.null;
  expect(document.assertionMethod).to.have.lengthOf(3);
  expect(document.assertionMethod[2].publicKeyHex).to.equal(veryKey.publicKey);
};

const shouldAddKeyAgreement = async (did) => {
  const keyaKey = createKeyPair();
  const publicKeyBase58 = bs58.encode(Buffer.from(keyaKey.publicKey, "hex"));
  await did.addKeyAgreement({
    algorithm: "esecp256k1vk",
    encoding: "base58",
    publicKey: publicKeyBase58,
    controller: did.address,
  });
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(2);
  expect(document.verificationMethod[1].publicKeyBase58).to.equal(
    publicKeyBase58
  );

  expect(document.keyAgreement).to.not.be.null;
  expect(document.keyAgreement).to.have.lengthOf(1);
  expect(document.keyAgreement[0].publicKeyBase58).to.equal(publicKeyBase58);
};

const shouldBindKeyAgreement = async (did) => {
  const veryKey = createKeyPair();
  const keyaKey = createKeyPair();

  await did.addVerificationMethod({
    type: "vm",
    algorithm: "esecp256k1rm",
    encoding: "hex",
    publicKey: `0x${veryKey.publicKey}`,
    controller: did.id,
  });

  const publicKeyBase58 = bs58.encode(Buffer.from(keyaKey.publicKey, "hex"));
  await did.addKeyAgreement({
    algorithm: "esecp256k1vk",
    encoding: "base58",
    publicKey: publicKeyBase58,
    controller: did.id,
  });

  const vmId = processVerificationMethodIdForAttribute(
    did.id,
    veryKey.publicKey
  );

  await did.bindKeyAgreement(`${did.id}#${vmId}`);
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(3);

  expect(document.keyAgreement).to.not.be.null;
  expect(document.keyAgreement).to.have.lengthOf(2);
  expect(document.keyAgreement[1].publicKeyHex).to.equal(veryKey.publicKey);
};

const shouldAddCapabilityInvocation = async (did) => {
  const veryKey = createKeyPair();
  const invoKey = createKeyPair();
  await did.addVerificationMethod({
    type: "vm",
    algorithm: "esecp256k1rm",
    encoding: "hex",
    publicKey: `0x${veryKey.publicKey}`,
    controller: did.id,
  });

  await did.addCapabilityInvocation({
    algorithm: "esecp256k1vk",
    encoding: "hex",
    publicKey: `0x${invoKey.publicKey}`,
    controller: did.id,
  });
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(3);
  expect(document.verificationMethod[2].publicKeyHex).to.equal(
    invoKey.publicKey
  );

  expect(document.capabilityInvocation).to.not.be.null;
  expect(document.capabilityInvocation).to.have.lengthOf(1);
  expect(document.capabilityInvocation[0].publicKeyHex).to.equal(
    invoKey.publicKey
  );
};

const shouldBindCapabilityInvocation = async (did) => {
  const veryKey = createKeyPair();
  const invoKey = createKeyPair();
  await did.addVerificationMethod({
    type: "vm",
    algorithm: "esecp256k1rm",
    encoding: "hex",
    publicKey: `0x${veryKey.publicKey}`,
    controller: did.id,
  });

  await did.addCapabilityInvocation({
    algorithm: "esecp256k1vk",
    encoding: "hex",
    publicKey: `0x${invoKey.publicKey}`,
    controller: did.id,
  });

  const vmId = processVerificationMethodIdForAttribute(
    did.id,
    veryKey.publicKey
  );

  await did.bindCapabilityInvocation(`${did.id}#${vmId}`);
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(3);

  expect(document.capabilityInvocation).to.not.be.null;
  expect(document.capabilityInvocation).to.have.lengthOf(2);
  expect(document.capabilityInvocation[1].publicKeyHex).to.equal(
    veryKey.publicKey
  );
};

const shouldAddCapabilityDelegation = async (did) => {
  const deleKey = createKeyPair();
  await did.addCapabilityDelegation({
    algorithm: "esecp256k1vk",
    encoding: "pem",
    publicKey: deleKey.publicKey,
    controller: did.id,
  });
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(2);
  expect(document.verificationMethod[1].publicKeyPem).to.equal(
    deleKey.publicKey
  );

  expect(document.capabilityDelegation).to.not.be.null;
  expect(document.capabilityDelegation).to.have.lengthOf(1);
  expect(document.capabilityDelegation[0].publicKeyPem).to.equal(
    deleKey.publicKey
  );
};

const shouldBindCapabilityDelegation = async (did) => {
  const veryKey = createKeyPair();
  const deleKey = createKeyPair();
  await did.addVerificationMethod({
    type: "vm",
    algorithm: "esecp256k1rm",
    encoding: "hex",
    publicKey: `0x${veryKey.publicKey}`,
    controller: did.id,
  });

  const deleId = processVerificationMethodIdForAttribute(
    did.id,
    veryKey.publicKey
  );

  await did.addCapabilityDelegation({
    algorithm: "esecp256k1vk",
    encoding: "pem",
    publicKey: deleKey.publicKey,
    controller: did.id,
  });

  await did.bindCapabilityDelegation(`${did.id}#${deleId}`);
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(3);

  expect(document.capabilityDelegation).to.not.be.null;
  expect(document.capabilityDelegation).to.have.lengthOf(2);
  expect(document.capabilityDelegation[1].publicKeyHex).to.equal(
    veryKey.publicKey
  );
};

const shouldAddAKAId = async (did, id, validity) => {
  await did.addAKAId(id, validity);
  const document = await did.getDocument();
  expect(document.toJSON().alsoKnownAs).to.not.be.undefined;
};

const shouldRemoveAKAId = async (did, id) => {
  await did.removeAKAId(id);
  const document = await did.getDocument();
  expect(document.toJSON().alsoKnownAs).to.be.undefined;
};

export {
  shouldAddVerificationMethod,
  shouldAddAuthenticationMethod,
  shouldBindAuthenticationMethod,
  shouldAddAssertionMethod,
  shouldBindAssertionMethod,
  shouldAddKeyAgreement,
  shouldBindKeyAgreement,
  shouldAddCapabilityInvocation,
  shouldBindCapabilityInvocation,
  shouldAddCapabilityDelegation,
  shouldBindCapabilityDelegation,
  shouldAddAKAId,
  shouldRemoveAKAId,
};
