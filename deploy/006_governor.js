const hre = require("hardhat");

const path = require("path");
const { log, deployWithConfirmation } = require("../utils/deploy");

const deployNewGovernor = async () => {
  log("Running governor 1-minute deployment...");
  const { guardianAddr } = await hre.getNamedAccounts();
  if (!guardianAddr) {
    throw new Error("No guardian address defined.");
  }
  // Deploy a new governor contract.
  // The governor's admin is the guardian account (e.g. the multi-sig).
  // Set a min delay of 60sec for executing proposals.
  const dGovernor = await deployWithConfirmation("Governor", [
    guardianAddr,
    60,
  ]);
  console.log(`Governor deployed to ${dGovernor.address}`);
  log("Governor 1-minute lock deploy done.");
  return true;
};

const updateToNewGovernor = async (governor) => {};

const baseName = path.basename(__filename);
const main = async () => {
  console.log(`Running ${baseName} deployment...`);
  const newGovernor = await deployNewGovernor();
  await updateToNewGovernor(newGovernor);
  console.log(`${baseName} deploy done.`);
  return true;
};

main.id = baseName;
main.dependencies = [];
main.tags = ["governor"];

module.exports = main;
