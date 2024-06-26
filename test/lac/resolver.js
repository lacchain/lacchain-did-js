import chai from "chai";

import chaiAsPromised from "chai-as-promised";
import { getResolver } from "../../lib/resolver.js";

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

describe("LAC DIDResolver", () => {
  const did = "did:lac:omega:0xcd7ebd413d512b47d1d48e5ed27fe01c8c29fd98";
  const invalid = "dsid:lac:axcd7ebd413d512b47d1d48e5ed27fe01c8c29fd98";
  const resolver = getResolver({
    networks: [
      {
        name: "omega",
        registry: "0xde82d4Cea1242C04B6baF6f98095F6050c88f50b",
        rpcUrl: "http://34.73.228.200",
        nodeAddress: "0x971bb94d235a4ba42d53ab6fb0a86b12c73ba460",
        expiration: "1736394529",
      },
    ],
    // mode: 'explicit'
  });

  it("should resolve the DID Document", async () => {
    const document = await resolver.lac(did);
    expect(document).to.be.not.null;
  });

  it("should fail to resolve the Document of an invalid DID", async () => {
    try {
      await resolver.lac(invalid);
    } catch (e) {
      expect(e.message).to.equals("Invalid DID");
    }
  });
});
