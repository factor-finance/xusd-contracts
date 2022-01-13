const hre = require("hardhat");

const path = require("path");
const { getAssetAddresses } = require("../test/helpers.js");
const { deployWithConfirmation, withConfirmation } = require("../utils/deploy");

// Deploy the Flipper trading contract
const deployFlipper = async () => {
  const assetAddresses = await getAssetAddresses(deployments);
  const { governorAddr } = await hre.getNamedAccounts();

  const sGovernor = await ethers.provider.getSigner(governorAddr);
  const xusd = await ethers.getContract("XUSDProxy");

  await deployWithConfirmation("Flipper", [
    assetAddresses.DAI,
    xusd.address,
    assetAddresses.USDC,
    assetAddresses.USDT,
  ]);
  const flipper = await ethers.getContract("Flipper");
  await withConfirmation(flipper.transferGovernance(governorAddr));
  await withConfirmation(flipper.connect(sGovernor).claimGovernance());
};

const baseName = path.basename(__filename);
const main = async () => {
  console.log(`Running ${baseName} deployment...`);
  await deployFlipper();
  console.log(`${baseName} deploy done.`);
  return true;
};

main.id = baseName;
main.dependencies = ["proxies"];
main.tags = ["flipper"];

module.exports = main;
