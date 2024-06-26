import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import DID from "../../lib/did.js";
import { createKeyPair, sleep } from "../../lib/utils.js";
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
import { getLacDidTestParams } from "../testInitializer.js";

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

const { registry, nodeAddress, rpcUrl, network, expiration } =
  await getLacDidTestParams();

describe("LAC DID", () => {
  const newDid = async () => {
    return new DID({
      registry,
      nodeAddress,
      expiration,
      rpcUrl,
      network,
    });
  };
  const readOnly = new DID({
    address: "0x8adda74623d30d2dd9642119b0ea4f51b476e253",
    registry,
    nodeAddress,
    expiration,
    rpcUrl,
    network,
  });
  const did = new DID({
    registry,
    nodeAddress,
    expiration,
    rpcUrl,
    network,
  });
  const controller0 = {
    address: did.address,
    privateKey: did.config.controllerPrivateKey + "",
  };
  const controller1 = createKeyPair();
  const controller2 = createKeyPair();
  const controller3 = createKeyPair();
  const controller4 = createKeyPair();

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
    await shouldFailToChangeReadonlyDid(readOnly);
  });

  // it("should do automatic key rotation", async () => {
  //   await did.addController(controller2.address);
  //   await did.addController(controller3.address);
  //   await did.addController(controller4.address);

  //   await did.enableKeyRotation(10);

  //   const firstController = await did.getController();
  //   for (const i of new Array(10)) {
  //     const currentController = await did.getController();
  //     if (firstController !== currentController) {
  //       return expect(true).to.equals(true);
  //     }
  //     await sleep(1);
  //   }

  //   expect(true).to.equals(false);
  // });

  // it("should not do automatic key rotation", async () => {
  //   const lastController = await did.getController();
  //   did.setControllerKey(
  //     [controller0, controller1, controller2, controller3, controller4].find(
  //       (c) => c.address.toLowerCase() === lastController.toLowerCase()
  //     ).privateKey
  //   );
  //   await did.disableKeyRotation();
  //   did.setControllerKey(controller0.privateKey);
  //   await did.changeController(controller4.address);
  //   did.setControllerKey(controller4.privateKey);

  //   const currentController = await did.getController();

  //   expect(currentController.toLowerCase()).to.equal(
  //     controller4.address.toLowerCase()
  //   );
  // });

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
    const veryKey = createKeyPair();
    await did.revokeVerificationMethod({
      type: "vm",
      algorithm: "esecp256k1rm",
      encoding: "hex",
      publicKey: `0x${veryKey.publicKey}`,
      controller: did.address,
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
