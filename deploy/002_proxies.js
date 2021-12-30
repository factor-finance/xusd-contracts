const hre = require("hardhat");

const path = require("path");
const { getAssetAddresses, isFork } = require("../test/helpers.js");
const {
  log,
  deployWithConfirmation,
  withConfirmation,
} = require("../utils/deploy");

/**
 * Deploy the core contracts (Vault and XUSD).
 *
 */
const deployCore = async () => {
  const { guardianAddr } = await hre.getNamedAccounts();
  // const dGovernor = await deployWithConfirmation("Governor", [
  //   guardianAddr,
  //   60,
  // ]);
  const governorAddr = guardianAddr; // dGovernor.address;
  if (!governorAddr) {
    throw new Error("governor address not set.");
  }

  const assetAddresses = await getAssetAddresses(deployments);
  log(`Using asset addresses: ${JSON.stringify(assetAddresses, null, 2)}`);

  // Signers
  const sGovernor = await ethers.provider.getSigner(governorAddr);
  // Proxies
  await deployWithConfirmation("XUSDProxy");
  await deployWithConfirmation("VaultProxy");

  // Main contracts
  const dXUSD = await deployWithConfirmation("XUSD");
  const dVault = await deployWithConfirmation("Vault");
  const dVaultCore = await deployWithConfirmation("VaultCore");
  const dVaultAdmin = await deployWithConfirmation("VaultAdmin");

  // Get contract instances
  const cXUSDProxy = await ethers.getContract("XUSDProxy");
  const cVaultProxy = await ethers.getContract("VaultProxy");
  const cXUSD = await ethers.getContractAt("XUSD", cXUSDProxy.address);
  const cOracleRouter = await ethers.getContract("OracleRouter");
  const cVault = await ethers.getContractAt("Vault", cVaultProxy.address);

  await withConfirmation(
    cXUSDProxy["initialize(address,address,bytes)"](
      dXUSD.address,
      governorAddr,
      []
    )
  );
  log("Initialized XUSDProxy");

  // Need to call the initializer on the Vault then upgraded it to the actual
  // VaultCore implementation
  await withConfirmation(
    cVaultProxy["initialize(address,address,bytes)"](
      dVault.address,
      governorAddr,
      []
    )
  );
  log("Initialized VaultProxy");

  await withConfirmation(
    cVault
      .connect(sGovernor)
      .initialize(cOracleRouter.address, cXUSDProxy.address)
  );
  log("Initialized Vault");

  await withConfirmation(
    cVaultProxy.connect(sGovernor).upgradeTo(dVaultCore.address)
  );
  log("Upgraded VaultCore implementation");

  await withConfirmation(
    cVault.connect(sGovernor).setAdminImpl(dVaultAdmin.address)
  );
  log("Initialized VaultAdmin implementation");

  // Initialize XUSD
  await withConfirmation(
    cXUSD.connect(sGovernor).initialize("XUSD", "XUSD", cVaultProxy.address)
  );

  log("Initialized XUSD");
};

const baseName = path.basename(__filename);
const main = async () => {
  console.log(`Running ${baseName} deployment...`);
  // assumes you have a guardian deployed
  await deployCore();
  console.log(`${baseName} deploy done.`);
  return true;
};

main.id = baseName;
main.dependencies = ["oracles"];
main.tags = ["proxies"];

module.exports = main;
