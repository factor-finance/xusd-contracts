const hre = require("hardhat");

const path = require("path");
const {
  log,
  withConfirmation,
  deployWithConfirmation,
  sendProposal,
  executeProposal,
} = require("../utils/deploy");
const { proposeArgs } = require("../utils/governor");
const { isMainnet, isFuji, isFork, isTest } = require("../test/helpers.js");

const deployNewGovernor = async () => {
  log("Running governor 1-minute deployment...");
  const { guardianAddr } = await hre.getNamedAccounts();
  if (!guardianAddr) {
    throw new Error("No guardian address defined.");
  }
  // Deploy a governor contract.
  // The governor's admin is the guardian account (e.g. the multi-sig).
  // Set a min delay of 60sec for executing proposals.
  const dGovernor = await deployWithConfirmation("Governor", [
    guardianAddr,
    60,
  ]);
  console.log(`Governor deployed to ${dGovernor.address}`);
  log("Governor 1-minute lock deploy done.");
  return dGovernor;
};

const updateToNewGovernor = async (dNewGovernor) => {
  const { governorAddr } = await hre.getNamedAccounts();
  const sGovernor = ethers.provider.getSigner(governorAddr);
  const newGovernor = await ethers.getContractAt(
    "Governor",
    dNewGovernor.address
  );

  const cXUSDProxy = await ethers.getContract("XUSDProxy");
  const cVaultProxy = await ethers.getContract("VaultProxy");
  const cAaveStrategyProxy = await ethers.getContract("AaveStrategyProxy");
  const cFlipper = await ethers.getContract("Flipper");

  const contracts = [cXUSDProxy, cVaultProxy, cFlipper, cAaveStrategyProxy];
  // Governor is a signer. We can connect and transfer to a contract Governor+Admin
  const newGovernorAddr = isTest == true ? governorAddr : newGovernor.address;
  contracts.forEach(async (contract) => {
    await withConfirmation(
      contract.connect(sGovernor).transferGovernance(newGovernorAddr)
    );
  });
  const propDescription = "Transfer governance to 1-minute governor";
  const propArgs = await proposeArgs(
    contracts.map((contract) => {
      return {
        contract: contract,
        signature: "claimGovernance()",
      };
    })
  );
  log(
    `Transferring governance from ${governorAddr} to ${
      newGovernor.address
    } with admin ${await newGovernor.admin()}`
  );

  if (isMainnet || isFuji) {
    log(
      "Next step: propose, enqueue and execute a governance proposal to claim governance."
    );
    log(`Governor address: ${governorAddr}`);
    log(`Proposal [targets, values, sigs, datas]:`);
    log(JSON.stringify(propArgs, null, 2));
    log("Sending transfer proposal to old governor...");
    // anyone can propose
    await sendProposal(propArgs, propDescription, {
      governorAddr,
    });
    log("Transfer proposal sent.");
  } else if (isFork) {
    log("Sending and executing claim proposal...");
    await executeProposal(propArgs, propDescription, {
      governorAddr: newGovernorAddr,
    });
    log("Executed claim proposal...");
  } else {
    // Testmode where sGovernor is a signer
    contracts.forEach(async (contract) => {
      await withConfirmation(
        contract
          // Claim governance with governor account
          .connect(sGovernor)
          .claimGovernance()
      );
    });
    log(`Claimed governance signer ${governorAddr}`);
  }
};

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
