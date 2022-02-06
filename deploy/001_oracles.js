const hre = require("hardhat");

const path = require("path");
const {
  getAssetAddresses,
  getOracleAddresses,
  isTest,
  isFuji,
  isFujiFork,
} = require("../test/helpers.js");
const { deployWithConfirmation, withConfirmation } = require("../utils/deploy");

/**
 * Deploy the OracleRouter and initialise it with Chainlink sources.
 */
const deployOracles = async () => {
  const { deployerAddr } = await getNamedAccounts();
  // Signers
  const sDeployer = await ethers.provider.getSigner(deployerAddr);

  let oracleContract;
  if (isTest) {
    oracleContract = "OracleRouterDev";
  } else if (isFuji || isFujiFork) {
    oracleContract = "OracleRouterTestnet";
  } else {
    oracleContract = "OracleRouter";
  }
  console.log(`Deploying ${oracleContract} oracle`);
  await deployWithConfirmation("OracleRouter", [], oracleContract);
  const oracleRouter = await ethers.getContract("OracleRouter");

  // Register feeds
  // Not needed in production
  if (isTest) {
    const oracleAddresses = await getOracleAddresses(deployments);
    const assetAddresses = await getAssetAddresses(deployments);
    withConfirmation(
      oracleRouter
        .connect(sDeployer)
        .setFeed(assetAddresses.DAI, oracleAddresses.chainlink.DAI_USD)
    );
    withConfirmation(
      oracleRouter
        .connect(sDeployer)
        .setFeed(assetAddresses.USDC, oracleAddresses.chainlink.USDCe_USD)
    );
    withConfirmation(
      oracleRouter
        .connect(sDeployer)
        .setFeed(assetAddresses.USDC_native, oracleAddresses.chainlink.USDC_USD)
    );
    withConfirmation(
      oracleRouter
        .connect(sDeployer)
        .setFeed(assetAddresses.USDT, oracleAddresses.chainlink.USDT_USD)
    );
    withConfirmation(
      oracleRouter
        .connect(sDeployer)
        .setFeed(assetAddresses.TUSD, oracleAddresses.chainlink.TUSD_USD)
    );
    withConfirmation(
      oracleRouter
        .connect(sDeployer)
        .setFeed(assetAddresses.WAVAX, oracleAddresses.chainlink.AVAX_USD)
    );
    withConfirmation(
      oracleRouter
        .connect(sDeployer)
        .setFeed(
          assetAddresses.NonStandardToken,
          oracleAddresses.chainlink.NonStandardToken_USD
        )
    );
  }
};

const baseName = path.basename(__filename);
const main = async () => {
  console.log(`Running ${baseName} deployment...`);
  // assumes you have a guardian deployed
  await deployOracles();
  console.log(`${baseName} deploy done.`);
  return true;
};

main.id = baseName;
main.dependencies = [];
main.tags = ["oracles"];

module.exports = main;
