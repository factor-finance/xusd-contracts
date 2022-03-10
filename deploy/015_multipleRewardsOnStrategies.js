const {
  deploymentWithProposal,
  log,
  withConfirmation,
} = require("../utils/deploy");
const { getAssetAddresses, isFuji, isFujiFork } = require("../test/helpers.js");

module.exports = deploymentWithProposal(
  {
    deployName: "015_multipleRewardsOnStrategies",
    skip: () => isFuji || isFujiFork,
  },
  async ({ deployWithConfirmation, ethers, getTxOpts }) => {
    const { deployerAddr, governorAddr } = await hre.getNamedAccounts();
    const sDeployer = await ethers.provider.getSigner(deployerAddr);
    const assetAddresses = await getAssetAddresses(hre.deployments);

    const dVaultAdmin = await deployWithConfirmation(
      "VaultAdmin",
      undefined,
      undefined,
      true // Disable storage slot checking, we are renaming variables in InitializableAbstractStrategy.
    );
    const dVaultCore = await deployWithConfirmation(
      "VaultCore",
      undefined,
      undefined,
      true // Disable storage slot checking, we are renaming variables in InitializableAbstractStrategy.
    );

    log("Deployed VaultAdmin and VaultCore...");

    // Current contracts
    const cVaultProxy = await ethers.getContract("VaultProxy");
    const cVaultAdmin = await ethers.getContractAt(
      "VaultAdmin",
      cVaultProxy.address
    );
    const cVaultCore = await ethers.getContractAt(
      "VaultCore",
      cVaultProxy.address
    );
    const cVault = await ethers.getContractAt("Vault", cVaultProxy.address);

    // Deployer Actions
    // ----------------

    // 1. Deploy new implementation
    const dCurveUsdcStrategyImpl = await deployWithConfirmation(
      "CurveUsdcStrategy",
      undefined,
      undefined,
      true // Disable storage slot checking, we are renaming variables in InitializableAbstractStrategy.
    );
    const dAaveStrategyImpl = await deployWithConfirmation(
      "AaveStrategy",
      undefined,
      undefined,
      true // Disable storage slot checking, we are renaming variables in InitializableAbstractStrategy.
    );

    // Curve USDC
    const cCurveUsdcStrategyProxy = await ethers.getContract(
      "CurveUsdcStrategyProxy"
    );
    const cCurveUsdcStrategy = await ethers.getContractAt(
      "CurveUsdcStrategy",
      cCurveUsdcStrategyProxy.address
    );
    log(
      "CurveUsdcStrategyProxy proxyAddress:",
      cCurveUsdcStrategyProxy.address,
      " governor:",
      await cCurveUsdcStrategyProxy.governor()
    );

    // AAVE
    const cAaveStrategyProxy = await ethers.getContract("AaveStrategyProxy");

    const cAaveStrategy = await ethers.getContractAt(
      "AaveStrategy",
      cAaveStrategyProxy.address
    );
    log(
      "AaveStrategyProxy proxyAddress:",
      cAaveStrategyProxy.address,
      " governor:",
      await cAaveStrategyProxy.governor()
    );

    // Governance Actions
    // ----------------

    return {
      name: "Upgrade strategies to support multiple reward tokens",
      actions: [
        // 1. Upgrade implementation Convex
        {
          contract: cCurveUsdcStrategyProxy,
          signature: "upgradeTo(address)",
          args: [dCurveUsdcStrategyImpl.address],
        },
        // 2. Use CRV as main rewards token and CVX as a secondary
        {
          contract: cCurveUsdcStrategy,
          signature: "setRewardTokenAddresses(address[])",
          args: [[assetAddresses.CRV, assetAddresses.WAVAX]],
        },
        // 3. Upgrade implementation Aave
        {
          contract: cAaveStrategyProxy,
          signature: "upgradeTo(address)",
          args: [dAaveStrategyImpl.address],
        },
        // 4. Set Aave reward token
        {
          contract: cAaveStrategy,
          signature: "setRewardTokenAddresses(address[])",
          args: [[assetAddresses.WAVAX]],
        },
        // 5. Set VaultCore implementation
        {
          contract: cVaultProxy,
          signature: "upgradeTo(address)",
          args: [dVaultCore.address],
        },
        // 6. Set VaultAdmin implementation
        {
          contract: cVault,
          signature: "setAdminImpl(address)",
          args: [dVaultAdmin.address],
        },
      ],
    };
  }
);
