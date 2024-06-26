import chai from "chai";

import chaiAsPromised from "chai-as-promised";
import { getResolver } from "../../lib/lac1/resolver.js";
import {
  getLac1didTestParams,
  newLac1Did as newDid,
} from "../testInitializer.js";

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

describe("Lac1 DIDResolver", async () => {
  const { registry, nodeAddress, rpcUrl, chainId } =
    await getLac1didTestParams();
  const invalid = "dsid:lac:axcd7ebd413d512b47d1d48e5ed27fe01c8c29fd98";
  const resolver = getResolver({
    networks: [
      {
        registry,
        rpcUrl,
        nodeAddress,
        chainId,
      },
    ],
    // mode: 'explicit'
  });

  it("should resolve the DID Document", async () => {
    const did = await newDid();
    const document = await resolver.lac1(did.id);
    expect(document).to.be.not.null;
  });

  it("should fail to resolve the Document of an invalid DID", async () => {
    try {
      await resolver.lac1(invalid);
    } catch (e) {
      expect(e.message).to.equals("Invalid DID");
    }
  });
  it("Should set current DID Controller as the default verification method with authentication relationship", async () => {
    const did = await newDid();
    const document = await resolver.lac1(did.id);
    const d = document.verificationMethod[0];
    expect(d["controller"]).to.eq(did.id);
    expect(d["id"]).to.eq(`${did.id}#controller`);
    expect(d["type"]).to.eq("EcdsaSecp256k1RecoveryMethod2020");
    const currentController = await did.getController();
    const retrievedHexchainId =
      did.chainId.length % 2 == 0 ? did.chainId : "0" + did.chainId;
    const retrievedIntchainId = parseInt(retrievedHexchainId, 16);
    const blockchainAccountId = `eip155:${retrievedIntchainId}:${currentController}`;
    expect(d["blockchainAccountId"]).to.eq(blockchainAccountId);
  });
});
