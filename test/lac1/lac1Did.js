import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { createKeyPair, sleep } from "../../lib/utils.js";
import DIDLac1 from "../../lib/lac1/lac1Did.js";
import {
  failToCreateWithoutAddress,
  shouldAddDidController,
  shouldAddService,
  shouldChangeDidController,
  shouldChangeDidControllerWithSignedTx,
  shouldFailToChangeDidController,
  shouldFailToChangeReadonlyDid,
  shouldGetDidDocumentExplicitMode,
  shouldGetDidDocumentReferenceMode,
  shouldRemoveLastDidController,
} from "../lac/lacBaseTestMethods.js";

import {
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
  shouldAddSigAuthDelegate,
  shouldRevokeSigAuthDelegate,
  shouldRevokeVeriKeyDelegate,
  shouldAddVeriKeyDelegate,
  shouldAddSigAuthDelegateAndAttributeDelegate,
} from "./lac1BaseTestMethods.js";
import {
  getLac1didTestParams,
  newLac1Did as newDid,
} from "../testInitializer.js";

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

const { registry, nodeAddress, rpcUrl, network, expiration, chainId } =
  await getLac1didTestParams();

describe("LAC1 DID", async () => {
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
      controller: did.id,
    });

    await did.revokeVerificationMethod({
      type: "vm",
      algorithm: "esecp256k1rm",
      encoding: "hex",
      publicKey: `0x${veryKey.publicKey}`,
      controller: did.id,
      revokeDeltaTimeSeconds: 86400, // e.g. 86400: 1 day before
      compromised: false, // the key is being rotated (not compomised)
    });

    const document = await did.getDocument();
    expect(document.verificationMethod).to.have.lengthOf(1);
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

  it("Should add an AKA Identifier to a DID", async () => {
    const did = await newDid();
    const someId = "id:123";
    const validity = 86400 * 365;
    await shouldAddAKAId(did, someId, validity);
  });

  it("Should remove an AKA Identifier to a DID", async () => {
    const did = await newDid();
    const someId = "id:123";
    const validity = 86400 * 365;
    await shouldAddAKAId(did, someId, validity);
    await shouldRemoveAKAId(did, someId);
  });

  it("Should add onchain 'sigAuth' delegate", async () => {
    const did = await newDid();
    const validity = 86400 * 365;
    await shouldAddSigAuthDelegate(did, validity);
  });

  it("Should add onchain 'veriKey' delegate", async () => {
    const did = await newDid();
    const validity = 86400 * 365;
    await shouldAddVeriKeyDelegate(did, validity);
  });

  it("Should revoke onchain 'sigAuth' delegate", async () => {
    const did = await newDid();
    await shouldRevokeSigAuthDelegate(did);
  });
  it("Should revoke onchain 'veriKey' delegate", async () => {
    const did = await newDid();
    await shouldRevokeVeriKeyDelegate(did);
  });

  it("Should omit blockchain account id as attribute", async () => {
    const did = await newDid();
    const validity = 86400 * 365;
    await shouldAddSigAuthDelegateAndAttributeDelegate(did, validity);
  });
});
