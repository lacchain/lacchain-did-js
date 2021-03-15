const Migrations = artifacts.require("Migrations");
const DIDRegistry = artifacts.require("DIDRegistry");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(DIDRegistry);
};
