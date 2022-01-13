const hre = require("hardhat");

const path = require("path");
const {
  log,
  executeProposal,
  sendProposal,
  deployWithConfirmation,
} = require("../utils/deploy");
<<<<<<< HEAD
const { isTest, isFork, isMainnet, isFuji } = require("../test/helpers");
=======
const { isTest, isFork, isMainnet } = require("../test/helpers");
>>>>>>> 8e34b63e (claim governance with idemopotency)
const { proposeArgs } = require("../utils/governor");

const claimGovernance = async () => {
  const { guardianAddr } = await hre.getNamedAccounts();

  let minDelay = 60 * 60 * 24 * 2; // 2 days
  if (isFuji) {
    minDelay = 60; // 1 minute. The change demostrates gov->gov handoff
  }

  const oldGovernor = await ethers.getContract("Governor");
  // Deploy a new governor contract.
  // The governor's admin is the guardian account (e.g. the multi-sig).
  const newGovernor = await deployWithConfirmation("Governor", [
    guardianAddr,
    minDelay,
  ]);
  log("Deployed new 2-day timelock governor");

  const cXUSDProxy = await ethers.getContract("XUSDProxy");
  const cVaultProxy = await ethers.getContract("VaultProxy");
  const cAaveStrategyProxy = await ethers.getContract("AaveStrategyProxy");
  const cFlipper = await ethers.getContract("Flipper");

  const contracts = [cXUSDProxy, cVaultProxy, cAaveStrategyProxy, cFlipper];
  const propTransferDescription = "Transfer governance to 1-minute governor";
  const propTransferArgs = await proposeArgs(
    contracts.map((contract) => {
      return {
        contract: contract,
        signature: "transferGovernance(address)",
        args: [newGovernor.address],
      };
    })
  );

  // Debug any stray contracts
  // await contracts.forEach(async (contract) => {
  //   const thisGovernorAddr = await contract.governor()
  //   console.log(`Contract: ${contract.address} has governor ${thisGovernorAddr} with admin: ${await oldGovernor.admin()}`);
  // });

  const propClaimDescription = "Transfer governance to 1-minute governor";
  const propClaimArgs = await proposeArgs(
    contracts.map((contract) => {
      return {
        contract: contract,
        signature: "claimGovernance()",
      };
    })
  );

  if (isMainnet || isFuji) {
    // On Mainnet, only propose. The enqueue and execution are handled manually via multi-sig.
    log("Sending transfer proposal to old governor...");
    await sendProposal(propTransferArgs, propTransferDescription, {
      governorAddr: oldGovernor.address,
    });
    log("Transfer proposal sent.");

    log("Sending claim proposal to new governor...");
    await sendProposal(propClaimArgs, propClaimDescription);
    log("Claim proposal sent.");
  } else if (isFork) {
    // On Fork we can send the proposal then impersonate the guardian to execute it.
    log("Sending and executing transfer proposal...");
    // Note: we send the proposal to the old governor by passing explicitly its address.
    await executeProposal(propTransferArgs, propTransferDescription, {
      governorAddr: oldGovernor.address,
    });

    log("Sending and executing claim proposal...");
    await executeProposal(propClaimArgs, propClaimDescription, {
      guardianAddr,
    });
  }
};

const baseName = path.basename(__filename);
const main = async () => {
  console.log(`Running ${baseName} deployment...`);
  await claimGovernance();
  console.log(`${baseName} deploy done.`);
  return true;
};

main.id = baseName;
main.dependencies = [];
main.tags = ["twoDayGovernor"];
main.skip = () => isTest;

module.exports = main;
