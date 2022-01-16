const hre = require("hardhat");

const path = require("path");
const { getAssetAddresses, isMainnet } = require("../test/helpers.js");
const {
  log,
  deployWithConfirmation,
  withConfirmation,
} = require("../utils/deploy");

/**
 * Deploy AAVE Strategy which only supports DAI.
 * Deploys a proxy, the actual strategy, initializes the proxy and initializes
 * the strategy.
 */
const deployAaveStrategy = async () => {
  const assetAddresses = await getAssetAddresses(hre.deployments);
  const { governorAddr, deployerAddr } = await getNamedAccounts();
  // Signers
  const sDeployer = await ethers.provider.getSigner(deployerAddr);
  const sGovernor = await ethers.provider.getSigner(governorAddr);

  const cVaultProxy = await ethers.getContract("VaultProxy");

  const dAaveStrategyProxy = await deployWithConfirmation(
    "AaveStrategyProxy",
    [],
    "InitializeGovernedUpgradeabilityProxy"
  );
  const cAaveStrategyProxy = await ethers.getContract("AaveStrategyProxy");
  const dAaveStrategy = await deployWithConfirmation("AaveStrategy");
  const cAaveStrategy = await ethers.getContractAt(
    "AaveStrategy",
    dAaveStrategyProxy.address
  );
  await withConfirmation(
    cAaveStrategyProxy["initialize(address,address,bytes)"](
      dAaveStrategy.address,
      governorAddr,
      []
    )
  );

  log("Initialized AaveStrategyProxy");
  const initFunctionName =
    "initialize(address,address,address,address[],address[],address)";
  await withConfirmation(
    cAaveStrategy
      .connect(sGovernor)
      [initFunctionName](
        assetAddresses.AAVE_ADDRESS_PROVIDER,
        cVaultProxy.address,
        assetAddresses.WAVAX,
        [assetAddresses.DAI, assetAddresses.USDT, assetAddresses.USDC],
        [assetAddresses.avDAI, assetAddresses.avUSDT, assetAddresses.avUSDC],
        assetAddresses.AAVE_INCENTIVES_CONTROLLER
      )
  );
  return cAaveStrategy;
};

const baseName = path.basename(__filename);
const main = async () => {
  console.log(`Running ${baseName} deployment...`);
  await deployAaveStrategy();

  console.log(`${baseName} deploy done.`);
  return true;
};

main.id = baseName;
main.dependencies = ["proxies", "oracles", "vault_config"];
main.tags = ["strategies"];

module.exports = main;
