const hre = require("hardhat");

const path = require("path");
const { log, withConfirmation } = require("../utils/deploy");
const { getTxOpts } = require("../utils/tx");

const claimGovernance = async () => {
  const { deployerAddr, guardianAddr, governorAddr } =
    await hre.getNamedAccounts();
  const newGovernor = await ethers.getContractAt("Governor", governorAddr);
  const sDeployer = await ethers.provider.getSigner(deployerAddr);
  const sGuardian = await ethers.provider.getSigner(guardianAddr);
  const cXUSDProxy = await ethers.getContract("XUSDProxy");
  const cVaultProxy = await ethers.getContract("VaultProxy");
  const cAaveStrategyProxy = await ethers.getContract("AaveStrategyProxy");
  const cXUSD = await ethers.getContractAt("XUSD", cXUSDProxy.address);
  const cVault = await ethers.getContractAt("VaultAdmin", cVaultProxy.address);
  const cAaveStrategy = await ethers.getContractAt(
    "AaveStrategy",
    cAaveStrategyProxy.address
  );
  await withConfirmation(
    cVault.connect(sDeployer).transferGovernance(newGovernor.address)
  );
  log(`Transfer governance of vault with ${newGovernor.address}`);
  await withConfirmation(
    cVault.connect(sDeployer).claimGovernance(await getTxOpts())
  );
  log(`Claimed governance of vault with ${newGovernor.address}`);

  await withConfirmation(
    cXUSD.connect(sGuardian).transferGovernance(newGovernor.address)
  );
  await withConfirmation(cXUSD.connect(sGuardian).claimGovernance());
  log(`Claimed governance of XUSD with ${newGovernor.address}`);
  await withConfirmation(
    cAaveStrategy.connect(sGuardian).transferGovernance(newGovernor.address)
  );
  await withConfirmation(cAaveStrategy.connect(sGuardian).claimGovernance());
  log(`Claimed governance of AaveStrategy with ${newGovernor.address}`);

  await withConfirmation(
    cVaultProxy.connect(sDeployer).transferGovernance(newGovernor.address)
  );
  await withConfirmation(cVaultProxy.connect(sDeployer).claimGovernance());
  log(`Claimed governance of vault proxy with ${newGovernor.address}`);
  await withConfirmation(
    cXUSDProxy.connect(sGuardian).transferGovernance(newGovernor.address)
  );
  await withConfirmation(cXUSDProxy.connect(sGuardian).claimGovernance());
  log(`Claimed governance of XUSD proxy with ${newGovernor.address}`);
  await withConfirmation(
    cAaveStrategyProxy
      .connect(sGuardian)
      .transferGovernance(newGovernor.address)
  );
  await withConfirmation(
    cAaveStrategyProxy.connect(sGuardian).claimGovernance()
  );
  log(`Claimed governance of AaveStrategy proxy with ${newGovernor.address}`);
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
main.tags = ["newGovernor"];

module.exports = main;
