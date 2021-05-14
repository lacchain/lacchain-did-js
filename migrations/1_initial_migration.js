const Migrations = artifacts.require("Migrations");
const DIDRegistry = artifacts.require("DIDRegistry");
const DIDRegistryRecoverable = artifacts.require("DIDRegistryRecoverable");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(DIDRegistry, 5);
  deployer.deploy(DIDRegistryRecoverable, 5, 3, 5, 5);
};
