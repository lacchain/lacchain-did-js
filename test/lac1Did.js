import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { createKeyPair, sleep } from "../lib/utils.js";
import DIDLac1 from "../lib/lac1/lac1Did.js";
import {
  failToCreateWithoutAddress,
  shouldAddAssertionMethod,
  shouldAddAuthenticationMethod,
  shouldAddCapabilityDelegation,
  shouldAddCapabilityInvocation,
  shouldAddDidController,
  shouldAddKeyAgreement,
  shouldAddService,
  shouldAddVerificationMethod,
  shouldBindAssertionMethod,
  shouldBindAuthenticationMethod,
  shouldBindCapabilityDelegation,
  shouldBindCapabilityInvocation,
  shouldBindKeyAgreement,
  shouldChangeDidController,
  shouldChangeDidControllerWithSignedTx,
  shouldFailToChangeDidController,
  shouldFailToChangeReadonlyDid,
  shouldGetDidDocumentExplicitMode,
  shouldGetDidDocumentReferenceMode,
  shouldRemoveLastDidController,
} from "./lacBaseTestMethods.js";
import {
  getLac1didTestParams,
  newLac1Did as newDid,
} from "./testInitializer.js";

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

const { registry, nodeAddress, rpcUrl, network, expiration } =
  await getLac1didTestParams();

describe("DIDLac1", async () => {
  const veryKey = createKeyPair();

  it("should fail to create a DID without address", async () => {
    await failToCreateWithoutAddress();
  });

  it("should add DID controller", async () => {
    const did = await newDid();
    await shouldAddDidController(did);
  });

  it("should change the DID controller", async () => {
    const did = await newDid();
    await shouldChangeDidController(did);
  });

  it("should fail to change the DID controller", async () => {
    const did = await newDid();
    await shouldFailToChangeDidController(did);
  });

  it("should change the DID controller using a signed tx", async () => {
    const did = await newDid();
    await shouldChangeDidControllerWithSignedTx(did);
  });

  it("should remove last DID controller", async () => {
    const did = await newDid();
    await shouldRemoveLastDidController(did);
  });

  it("should fail to change a read-only DID controller", async () => {
    const readOnly = await DIDLac1.new({
      address: createKeyPair().address,
      registry,
      nodeAddress,
      expiration,
      rpcUrl,
      network,
      chainId,
    });
    await shouldFailToChangeReadonlyDid(readOnly);
  });

  it("should add a Verification Method", async () => {
    const did = await newDid();
    await shouldAddVerificationMethod(did);
  });

  it("should add an Authentication Method", async () => {
    const did = await newDid();
    await shouldAddAuthenticationMethod(did);
  });

  it("should bind an Authentication Method", async () => {
    const did = await newDid();
    await shouldBindAuthenticationMethod(did);
  });

  it("should add an Assertion Method", async () => {
    const did = await newDid();
    await shouldAddAssertionMethod(did);
  });

  it("should bind and Assertion Method", async () => {
    const did = await newDid();
    await shouldBindAssertionMethod(did);
  });

  it("should add a Key Agreement", async () => {
    const did = await newDid();
    await shouldAddKeyAgreement(did);
  });

  it("should bind a Key Agreement", async () => {
    const did = await newDid();
    await shouldBindKeyAgreement(did);
  });

  it("should add a Capability Invocation", async () => {
    const did = await newDid();
    await shouldAddCapabilityInvocation(did);
  });

  it("should bind a Capability Invocation", async () => {
    const did = await newDid();
    await shouldBindCapabilityInvocation(did);
  });

  it("should add a Capability Delegation", async () => {
    const did = await newDid();
    await shouldAddCapabilityDelegation(did);
  });

  it("should bind a Capability Delegation", async () => {
    const did = await newDid();
    await shouldBindCapabilityDelegation(did);
  });

  it("should revoke a Verification Method", async () => {
    const did = await newDid();

    await did.addVerificationMethod({
      type: "vm",
      algorithm: "esecp256k1rm",
      encoding: "hex",
      publicKey: `0x${veryKey.publicKey}`,
      controller: did.address,
    });

    await did.revokeVerificationMethod({
      type: "vm",
      algorithm: "esecp256k1rm",
      encoding: "hex",
      publicKey: `0x${veryKey.publicKey}`,
      controller: did.address,
      revokeDeltaTimeSeconds: 86400, // e.g. 86400: 1 day before
      compromised: false, // the key is being rotated (not compomised)
    });

    const document = await did.getDocument();
    expect(document.verificationMethod).to.have.lengthOf(0);
  });

  it("should add a Service", async () => {
    const did = await newDid();
    await shouldAddService(did);
  });

  it("should get the DID Document in explicit mode", async () => {
    const did = await newDid();
    await shouldGetDidDocumentExplicitMode(did);
  });

  it("should get the DID Document in reference mode", async () => {
    const did = await newDid();
    await shouldGetDidDocumentReferenceMode(did);
  });
});
