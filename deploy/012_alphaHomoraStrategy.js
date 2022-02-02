const hre = require("hardhat");

const path = require("path");
const { getAssetAddresses } = require("../test/helpers.js");
const {
  log,
  deployWithConfirmation,
  withConfirmation,
} = require("../utils/deploy");
const addresses = require("../utils/addresses.js");

/**
 * Deploy AAVE Strategy which only supports DAI.
 * Deploys a proxy, the actual strategy, initializes the proxy and initializes
 * the strategy.
 */
const deployAlphaHomoraStrategy = async () => {
  const assetAddresses = await getAssetAddresses(hre.deployments);
  const { governorAddr } = await getNamedAccounts();
  // Signers
  const sGovernor = await ethers.provider.getSigner(governorAddr);

  const cVaultProxy = await ethers.getContract("VaultProxy");

  const dAlphaHomoraStrategyProxy = await deployWithConfirmation(
    "AlphaHomoraStrategyProxy",
    [],
    "InitializeGovernedUpgradeabilityProxy"
  );
  const cAlphaHomoraStrategyProxy = await ethers.getContract(
    "AlphaHomoraStrategyProxy"
  );
  const dAlphaHomoraStrategy = await deployWithConfirmation(
    "AlphaHomoraStrategy"
  );
  const cAlphaHomoraStrategy = await ethers.getContractAt(
    "AlphaHomoraStrategy",
    dAlphaHomoraStrategyProxy.address
  );
  await withConfirmation(
    cAlphaHomoraStrategyProxy["initialize(address,address,bytes)"](
      dAlphaHomoraStrategy.address,
      governorAddr,
      []
    )
  );
  log("Initialized AlphaHomoraStrategyProxy");
  const initFunctionName =
    "initialize(address,address,address,address[],address[],address)";
  await withConfirmation(
    cAlphaHomoraStrategy
      .connect(sGovernor)
      [initFunctionName](
        addresses.dead,
        cVaultProxy.address,
        assetAddresses.WAVAX,
        [assetAddresses.DAI, assetAddresses.USDT, assetAddresses.USDC],
        [
          assetAddresses.SafeBoxDAIe,
          assetAddresses.SafeBoxUSDTe,
          assetAddresses.SafeBoxUSDCe,
        ],
        assetAddresses.ALPHA_INCENTIVES_CONTROLLER
      )
  );
  // TODO claim governance using proposal?
  return cAlphaHomoraStrategy;
};

const baseName = path.basename(__filename);
const main = async () => {
  console.log(`Running ${baseName} deployment...`);
  await deployAlphaHomoraStrategy();

  console.log(`${baseName} deploy done.`);
  return true;
};

main.id = baseName;
main.dependencies = ["proxies", "oracles", "vault_config"];
main.tags = ["alphaHomora"];

module.exports = main;
