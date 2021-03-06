const { utils } = require("ethers");
const hre = require("hardhat");

const path = require("path");
const { getTxOpts } = require("../utils/tx");
const { isFuji, isFujiFork, isTest } = require("../test/helpers.js");
const { log, withConfirmation } = require("../utils/deploy");
const addresses = require("../utils/addresses");

/**
 * Set default strategies for USDT, USDC, DAI
 */
const setVaultSettings = async () => {
  const { governorAddr, strategistAddr } = await getNamedAccounts();
  // Signers
  const sGovernor = await ethers.provider.getSigner(governorAddr);

  const cVault = await ethers.getContractAt(
    "VaultAdmin",
    (
      await ethers.getContract("VaultProxy")
    ).address
  );

  // Set Vault buffer
  await withConfirmation(
    cVault
      .connect(sGovernor)
      .setVaultBuffer(utils.parseUnits("2", 16), await getTxOpts())
  );
  log("set vault buffer");

  // Set Redeem fee BPS
  await withConfirmation(
    cVault.connect(sGovernor).setRedeemFeeBps(50),
    await getTxOpts()
  );
  log("Set redeem free bps");

  let routerAddress = addresses.mainnet.UNISWAP_ROUTER;
  if (isFuji || isFujiFork) {
    routerAddress = addresses.fuji.UNISWAP_ROUTER;
  }

  // Set Uniswap addr
  await withConfirmation(
    cVault.connect(sGovernor).setUniswapAddr(routerAddress, await getTxOpts())
  );
  log("Set Uniswap address");

  // Set strategist addr
  await withConfirmation(
    cVault
      .connect(sGovernor)
      .setStrategistAddr(strategistAddr, await getTxOpts())
  );
  log("Set strategist address");
};

const baseName = path.basename(__filename);
const main = async () => {
  console.log(`Running ${baseName} deployment...`);
  await setVaultSettings();

  console.log(`${baseName} deploy done.`);
  return true;
};

main.id = baseName;
main.dependencies = ["proxies"];
main.tags = ["vaultSettings"];
main.skip = () => isTest;

module.exports = main;
