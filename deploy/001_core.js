const hre = require("hardhat");

const {
  getAssetAddresses,
  getOracleAddresses,
  isMainnet,
  isFork,
} = require("../test/helpers.js");
const {
  log,
  deployWithConfirmation,
  withConfirmation,
} = require("../utils/deploy");

/**
 * Deploy the OracleRouter and initialise it with Chainlink sources.
 */
const deployOracles = async () => {
  const { deployerAddr } = await getNamedAccounts();
  // Signers
  const sDeployer = await ethers.provider.getSigner(deployerAddr);

  // TODO: Change this to intelligently decide which router contract to deploy?
  const oracleContract = isMainnet ? "OracleRouter" : "OracleRouterDev";
  await deployWithConfirmation("OracleRouter", [], oracleContract);
  const oracleRouter = await ethers.getContract("OracleRouter");

  // Register feeds
  // Not needed in production
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
      .setFeed(assetAddresses.USDC, oracleAddresses.chainlink.USDC_USD)
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
};

//
// Deploys a new governor contract on Mainnet
//

const deployGovernor = async () => {
  log("Running governor 1-minute deployment...");
  const { guardianAddr } = await hre.getNamedAccounts();
  if (!guardianAddr) {
    throw new Error("No guardian address defined.");
  }
  // Deploy a new governor contract.
  // The governor's admin is the guardian account (e.g. the multi-sig).
  // Set a min delay of 60sec for executing proposals.
  await deployWithConfirmation("Governor", [guardianAddr, 60]);

  log("Governor 1-minute lock deploy done.");
  return true;
};

const main = async () => {
  log("Running 001_core deployment...");
  // assumes you have a guardian deployed
  await deployGovernor();
  await deployOracles();
  log("001_core deploy done.");
  return true;
};

main.id = "001_core";
main.dependencies = ["mocks"];
main.tags = ["core"];
// main.skip = () => isFork && !(process.env.FORCE == "true");

module.exports = main;
