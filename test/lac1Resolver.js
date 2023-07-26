import chai from "chai";

import chaiAsPromised from "chai-as-promised";
import { getResolver } from "../lib/lac1/resolver.js";
import {
  getLac1didTestParams,
  newLac1Did as newDid,
} from "./testInitializer.js";

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

describe("Lac1DIDResolver", async () => {
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
});
