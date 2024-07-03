import DIDLac1 from "../lib/lac1/lac1Did.js";

const lac1Registry = "0xd2d7bF1A9a774f09cbA9541c5326B22f83f734Df";
const nodeAddress = "0xad730de8c4bfc3d845f7ce851bcf2ea17c049585";
const rpcUrl = "http://35.185.112.219";
const network = "openprotest";
const chainId = 648540;
const expiration = 1736394529;

// todo: run local network
export const getLac1didTestParams = async () => {
  return {
    registry: lac1Registry,
    nodeAddress,
    rpcUrl,
    network,
    chainId,
    expiration,
  };
};

export const newLac1Did = async () => {
  const { registry, nodeAddress, rpcUrl, network, expiration, chainId } =
    await getLac1didTestParams();
  return DIDLac1.new({
    registry,
    nodeAddress,
    expiration,
    rpcUrl,
    network,
    chainId,
  });
};

export const getLacDidTestParams = async () => {
  return {
    registry: "0xAB00e74C1b0A2313f552E869E6d55B5CdA31aFfe",
    nodeAddress,
    rpcUrl,
    network,
    expiration,
  };
};
