const hre = require("hardhat");

const {
  isMainnet,
  isFork,
  isFuji,
  isMainnetOrFujiOrFork,
} = require("../test/helpers.js");
const {
  log,
  deployWithConfirmation,
  withConfirmation,
  executeProposal,
  sendProposal,
} = require("../utils/deploy");
const { proposeArgs } = require("../utils/governor");
const { getTxOpts } = require("../utils/tx");

const deployName = "009_xusd_fix";

const fixXUSD = async () => {
  console.log(`Running ${deployName} deployment...`);

  const { governorAddr } = await hre.getNamedAccounts();

  // Signers
  const sGovernor = await ethers.provider.getSigner(governorAddr);

  // Temporary XUSD for running a reset
  const dXUSDReset = await deployWithConfirmation("XUSDReset");
  // Main XUSD
  const dXUSD = await deployWithConfirmation("XUSD");

  const cXUSDProxy = await ethers.getContract("XUSDProxy");
  const cXUSDReset = await ethers.getContractAt(
    "XUSDReset",
    cXUSDProxy.address
  );
  const cVaultProxy = await ethers.getContract("VaultProxy");

  // Proposal for the new governor to:
  // - upgradeTo XUSDReset
  // - call reset()
  // - upgradeTo XUSD
  const propResetDescription = "XUSD Reset";
  const propResetArgs = await proposeArgs([
    {
      contract: cXUSDProxy,
      signature: "upgradeTo(address)",
      args: [dXUSDReset.address],
    },
    {
      contract: cXUSDReset,
      signature: "reset()",
    },
    {
      contract: cXUSDReset,
      signature: "setVaultAddress(address)",
      args: [cVaultProxy.address],
    },
    {
      contract: cXUSDProxy,
      signature: "upgradeTo(address)",
      args: [dXUSD.address],
    },
  ]);

  if (isMainnet) {
    // On Mainnet, only propose. The enqueue and execution are handled manually via multi-sig.
    log("Sending proposal to governor...");
    await sendProposal(propResetArgs, propResetDescription);
    log("Proposal sent.");
  } else if (isFork) {
    // On Fork we can send the proposal then impersonate the guardian to execute it.
    log("Sending and executing proposal...");
    await executeProposal(propResetArgs, propResetDescription);
    log("Proposal executed.");
  } else {
    // Hardcoding gas estimate on Fuji since it fails for an undetermined reason...
    const gasLimit = isFuji ? 1000000 : null;
    await withConfirmation(
      cXUSDProxy
        .connect(sGovernor)
        .upgradeTo(dXUSDReset.address, await getTxOpts(gasLimit))
    );
    log("Upgraded XUSD to reset implementation");

    await withConfirmation(
      cXUSDReset
        .connect(sGovernor)
        .setVaultAddress(cVaultProxy.address, await getTxOpts(gasLimit))
    );
    log("Vault address set");

    await withConfirmation(
      cXUSDReset.connect(sGovernor).reset(await getTxOpts(gasLimit))
    );
    log("Called reset on XUSD");

    await withConfirmation(
      cXUSDProxy
        .connect(sGovernor)
        .upgradeTo(dXUSD.address, await getTxOpts(gasLimit))
    );
    log("Upgraded XUSD to standard implementation");
  }

  console.log(`${deployName} deploy done.`);
  return true;
};

const main = async () => {
  console.log(`Running ${deployName} deployment...`);
  await fixXUSD();
  console.log(`${deployName} deploy done.`);
  return true;
};

main.id = deployName;
main.dependencies = ["002_upgrade_vault", "003_governor", "008_xusd_reset"];
main.skip = () => !(isMainnet || isFuji) || isFork;

module.exports = main;
