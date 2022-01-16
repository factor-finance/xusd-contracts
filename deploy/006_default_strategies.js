const hre = require("hardhat");

const path = require("path");
const { getTxOpts } = require("../utils/tx");
const {
  getAssetAddresses,
  isFuji,
  isFujiFork,
  isTest,
} = require("../test/helpers.js");
const { log, withConfirmation } = require("../utils/deploy");

/**
 * Set default strategies for USDT, USDC, DAI
 */
const setDefaultStrategies = async () => {
  const assetAddresses = await getAssetAddresses(hre.deployments);
  const { governorAddr } = await getNamedAccounts();
  // Signers
  const sGovernor = await ethers.provider.getSigner(governorAddr);

  const cAaveStrategyProxy = await ethers.getContract("AaveStrategyProxy");

  const cVault = await ethers.getContractAt(
    "VaultAdmin",
    (
      await ethers.getContract("VaultProxy")
    ).address
  );
  try {
    // Approve strategies
    await withConfirmation(
      cVault
        .connect(sGovernor)
        .approveStrategy(cAaveStrategyProxy.address, await getTxOpts())
    );
    log("Approved Aave strategy");
  } catch (e) {
    log(e);
    log("continuing deploy...");
  }

  // Set up the default strategy for each asset
  await withConfirmation(
    cVault
      .connect(sGovernor)
      .setAssetDefaultStrategy(
        assetAddresses.USDT,
        cAaveStrategyProxy.address,
        await getTxOpts()
      )
  );
  log("Set asset default strategy for USDT");
  await withConfirmation(
    cVault
      .connect(sGovernor)
      .setAssetDefaultStrategy(
        assetAddresses.DAI,
        cAaveStrategyProxy.address,
        await getTxOpts()
      )
  );
  log("Set asset default strategy for DAI");
  // Aave does not support USDC on fuji
  if (!(isFuji || isFujiFork)) {
    await withConfirmation(
      cVault
        .connect(sGovernor)
        .setAssetDefaultStrategy(
          assetAddresses.USDC,
          cAaveStrategyProxy.address,
          await getTxOpts()
        )
    );
    log("Set asset default strategy for USDC");
  }
};

const baseName = path.basename(__filename);
const main = async () => {
  console.log(`Running ${baseName} deployment...`);
  await setDefaultStrategies();

  console.log(`${baseName} deploy done.`);
  return true;
};

main.id = baseName;
main.dependencies = ["strategies"];
main.tags = ["setdefaultstrats"];
main.skip = () => isTest;

module.exports = main;
