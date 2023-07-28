import chai from "chai";
import bs58 from "bs58";
import chaiAsPromised from "chai-as-promised";
import { createKeyPair, sleep } from "../lib/utils.js";
import DIDLac1 from "../lib/lac1/lac1Did.js";

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

const registry = "0xb4FB2e9BB0001cc8eAAE528571915F35Cb74C864"; // "0x6711Ed022C51fB5082cf8Ac6D51c45A03796b8d1";
const nodeAddress = "0xad730de8c4bfc3d845f7ce851bcf2ea17c049585";
const rpcUrl = "http://35.185.112.219";
const network = "openprotest";

const failToCreateWithoutAddress = async () => {
  try {
    await DIDLac1.new({
      controllerPrivateKey: createKeyPair().privateKey,
      registry,
      nodeAddress,
      expiration: 1736394529,
      rpcUrl,
      network,
    });
  } catch (e) {
    expect(e.message).to.equals(
      "If you set the controller private key you must also provide the DID address"
    );
  }
};

const shouldAddDidController = async (did) => {
  const controllerAddress = createKeyPair().address;
  await did.addController(controllerAddress);
  const controllers = await did.getControllers();
  expect(controllers.length).to.equals(2);
};

const shouldChangeDidController = async (did) => {
  const controllerAddress = createKeyPair().address;
  await did.addController(controllerAddress);
  await did.changeController(controllerAddress);
  const updatedController = await did.getController();
  expect(updatedController.toLowerCase()).to.equals(
    controllerAddress.toLowerCase()
  );
};

const shouldFailToChangeDidController = async (did) => {
  try {
    await did.changeController(did.address);
  } catch (e) {
    expect(e.reason).to.equals("transaction failed");
  }
};

const shouldChangeDidControllerWithSignedTx = async (did) => {
  const controllerAddress = createKeyPair().address;
  await did.addController(controllerAddress);
  await did.changeControllerSigned(
    did.config.controllerPrivateKey,
    controllerAddress
  );
  const updatedController = await did.getController();

  expect(updatedController.toLowerCase()).to.equals(
    controllerAddress.toLowerCase()
  );
};

const shouldRemoveLastDidController = async (did) => {
  const controllerAddress = createKeyPair().address;
  await did.addController(controllerAddress);
  await did.removeController(controllerAddress);
  const controllers = await did.getControllers();

  expect(controllers.length).to.equals(1);
};

const shouldFailToChangeReadonlyDid = async (readOnlyDid) => {
  const controllerAddress = createKeyPair().address;
  try {
    await readOnlyDid.changeController(controllerAddress);
  } catch (e) {
    expect(e.message).to.equals("Cannot change controller to a read-only DID");
  }
};

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
  // expect(document.verificationMethod).to.have.lengthOf(2); // TODO: Verify why this is not accomplished
  expect(document.verificationMethod[0].publicKeyHex).to.equal(
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

  expect(document.verificationMethod).to.have.lengthOf(1);
  expect(document.verificationMethod[0].publicKeyHex).to.equal(
    authKey.publicKey
  );

  expect(document.authentication).to.not.be.null;
  expect(document.authentication).to.have.lengthOf(1);
  expect(document.authentication[0].publicKeyHex).to.equal(authKey.publicKey);
};

const shouldBindAuthenticationMethod = async (did) => {
  const veryKey = createKeyPair();
  const authKey = createKeyPair();
  await did.addVerificationMethod({
    type: "vm",
    algorithm: "esecp256k1rm",
    encoding: "hex",
    publicKey: `0x${veryKey.publicKey}`,
    controller: did.address,
  });
  await did.addAuthenticationMethod({
    algorithm: "esecp256k1rm",
    encoding: "hex",
    publicKey: `0x${authKey.publicKey}`,
    controller: did.address,
  });
  let document = await did.getDocument();
  await did.bindAuthenticationMethod(`${did.id}#vm-0`);
  document = await did.getDocument();
  expect(document.verificationMethod).to.have.lengthOf(2);

  expect(document.authentication).to.not.be.null;
  expect(document.authentication).to.have.lengthOf(2);

  expect(document.authentication[1].publicKeyHex).to.equal(veryKey.publicKey); // last added -> last listed in array
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

  expect(document.verificationMethod).to.have.lengthOf(1);
  expect(document.verificationMethod[0].publicKeyBase64).to.equal(
    publicKeyBase64
  );

  expect(document.assertionMethod).to.not.be.null;
  expect(document.assertionMethod).to.have.lengthOf(1);
  expect(document.assertionMethod[0].publicKeyBase64).to.equal(publicKeyBase64);
};

const shouldBindAssertionMethod = async (did) => {
  const veryKey = createKeyPair();
  const asseKey = createKeyPair();
  await did.addVerificationMethod({
    type: "vm",
    algorithm: "esecp256k1rm",
    encoding: "hex",
    publicKey: `0x${veryKey.publicKey}`,
    controller: did.address,
  });

  const publicKeyBase64 = Buffer.from(asseKey.publicKey, "hex").toString(
    "base64"
  );

  await did.addAssertionMethod({
    algorithm: "esecp256k1vk",
    encoding: "base64",
    publicKey: publicKeyBase64,
    controller: did.address,
  });

  await did.bindAssertionMethod(`${did.id}#vm-0`);
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(2);

  expect(document.assertionMethod).to.not.be.null;
  expect(document.assertionMethod).to.have.lengthOf(2);
  expect(document.assertionMethod[1].publicKeyHex).to.equal(veryKey.publicKey);
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

  expect(document.verificationMethod).to.have.lengthOf(1);
  expect(document.verificationMethod[0].publicKeyBase58).to.equal(
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
    controller: did.address,
  });

  const publicKeyBase58 = bs58.encode(Buffer.from(keyaKey.publicKey, "hex"));
  await did.addKeyAgreement({
    algorithm: "esecp256k1vk",
    encoding: "base58",
    publicKey: publicKeyBase58,
    controller: did.address,
  });

  await did.bindKeyAgreement(`${did.id}#vm-0`);
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(2);

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
    controller: did.address,
  });

  await did.addCapabilityInvocation({
    algorithm: "esecp256k1vk",
    encoding: "hex",
    publicKey: `0x${invoKey.publicKey}`,
    controller: did.address,
  });
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(2);
  expect(document.verificationMethod[1].publicKeyHex).to.equal(
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
    controller: did.address,
  });

  await did.addCapabilityInvocation({
    algorithm: "esecp256k1vk",
    encoding: "hex",
    publicKey: `0x${invoKey.publicKey}`,
    controller: did.address,
  });

  await did.bindCapabilityInvocation(`${did.id}#vm-0`);
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(2);

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
    controller: did.address,
  });
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(1);
  expect(document.verificationMethod[0].publicKeyPem).to.equal(
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
    controller: did.address,
  });

  await did.addCapabilityDelegation({
    algorithm: "esecp256k1vk",
    encoding: "pem",
    publicKey: deleKey.publicKey,
    controller: did.address,
  });

  await did.bindCapabilityDelegation(`${did.id}#vm-0`);
  const document = await did.getDocument();

  expect(document.verificationMethod).to.have.lengthOf(2);

  expect(document.capabilityDelegation).to.not.be.null;
  expect(document.capabilityDelegation).to.have.lengthOf(2);
  expect(document.capabilityDelegation[1].publicKeyHex).to.equal(
    veryKey.publicKey
  );
};

const shouldAddService = async (did) => {
  await did.addService({
    type: "mailbox",
    endpoint: "https://mailbox.lacchain.net",
  });
  const document = await did.getDocument();

  expect(document.service).to.have.lengthOf(1);
  expect(document.service[0].type).to.equal("mailbox");
  expect(document.service[0].serviceEndpoint).to.equal(
    "https://mailbox.lacchain.net"
  );
};

const shouldGetDidDocumentExplicitMode = async (did) => {
  await shouldGetDidDocumentInSpecifiedMode(did, "explicit");
};

const shouldGetDidDocumentReferenceMode = async (did) => {
  await shouldGetDidDocumentInSpecifiedMode(did, "reference");
};

const shouldGetDidDocumentInSpecifiedMode = async (did, mode) => {
  const veryKey = createKeyPair();
  const someKey = createKeyPair();
  await did.addVerificationMethod({
    type: "vm",
    algorithm: "esecp256k1rm",
    encoding: "hex",
    publicKey: `0x${veryKey.publicKey}`,
    controller: did.address,
  });

  await did.addCapabilityDelegation({
    algorithm: "esecp256k1vk",
    encoding: "pem",
    publicKey: someKey.publicKey,
    controller: did.address,
  });

  did.config.mode = mode; // explicit or reference
  const document = await did.getDocument();
  expect(document.toJSON()).to.not.be.null;
};

export {
  failToCreateWithoutAddress,
  shouldAddDidController,
  shouldChangeDidController,
  shouldFailToChangeDidController,
  shouldChangeDidControllerWithSignedTx,
  shouldRemoveLastDidController,
  shouldFailToChangeReadonlyDid,
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
  shouldAddService,
  shouldGetDidDocumentExplicitMode,
  shouldGetDidDocumentReferenceMode,
};
