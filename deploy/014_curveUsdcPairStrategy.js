const {
  deploymentWithProposal,
  log,
  withConfirmation,
} = require("../utils/deploy");
const {
  getAssetAddresses,
  isFuji,
  isFujiFork,
  isTest,
} = require("../test/helpers.js");

module.exports = deploymentWithProposal(
  {
    deployName: "014_curveUsdcPairStrategy",
    skip: () => isFuji || isFujiFork,
  },
  async ({ deployWithConfirmation, ethers, getTxOpts }) => {
    const { deployerAddr, governorAddr } = await hre.getNamedAccounts();
    const sDeployer = await ethers.provider.getSigner(deployerAddr);
    const assetAddresses = await getAssetAddresses(hre.deployments);

    // Current contract
    const cVaultProxy = await ethers.getContract("VaultProxy");
    const cVault = await ethers.getContractAt("Vault", cVaultProxy.address);

    // Deploy proxy and strategy
    await deployWithConfirmation("CurveUsdcStrategyProxy");
    const cCurveUsdcStrategyProxy = await hre.ethers.getContract(
      "CurveUsdcStrategyProxy"
    );

    const dCurveUsdcStrategy = await deployWithConfirmation(
      "CurveUsdcStrategy"
    );
    const cCurveUsdcStrategy = await hre.ethers.getContractAt(
      "CurveUsdcStrategy",
      cCurveUsdcStrategyProxy.address
    );

    // Initialize Proxy.
    await withConfirmation(
      cCurveUsdcStrategyProxy["initialize(address,address,bytes)"](
        dCurveUsdcStrategy.address,
        deployerAddr,
        []
      )
    );
    // Initialize implementation.
    await withConfirmation(
      cCurveUsdcStrategy
        .connect(sDeployer)
        ["initialize(address,address,address,address[],address[],address)"](
          assetAddresses.CurveUsdcPool,
          cVaultProxy.address,
          assetAddresses.WAVAX,
          // Ordered!
          [assetAddresses.USDC, assetAddresses.USDC_native],
          [assetAddresses.CurveUsdcToken, assetAddresses.CurveUsdcToken],
          assetAddresses.CurveUsdcPoolGauge
        )
    );
    log("Initialized CurveUsdcStrategy");

    const dGovernor = await hre.ethers.getContract("Governor");
    // Initiate transfer of ownership to the governor.
    await withConfirmation(
      cCurveUsdcStrategy
        .connect(sDeployer)
        .transferGovernance(
          isTest ? governorAddr : dGovernor.address,
          await getTxOpts()
        )
    );
    log(`CurveUsdcStrategy transferGovernance(${governorAddr} called`);

    // Governance Actions
    // ----------------

    let actions;
    actions = [
      // claimGovernance using pending set above.
      {
        contract: cCurveUsdcStrategy,
        signature: "claimGovernance()",
        args: [],
      },
    ];
    if (!isTest) {
      actions = [
        ...actions,
        {
          contract: cVault,
          signature: "approveStrategy(address)",
          args: [cCurveUsdcStrategyProxy.address],
        },
        // approve strategy
        // initial set USDC_native default to curve USDC/USDCe pool
        {
          contract: cVault,
          signature: "setAssetDefaultStrategy(address,address)",
          args: [assetAddresses.USDC_native, cCurveUsdcStrategyProxy.address],
        },
        // change USDC default to curve USDC/USDCe pool
        {
          contract: cVault,
          signature: "setAssetDefaultStrategy(address,address)",
          args: [assetAddresses.USDC, cCurveUsdcStrategyProxy.address],
        },
      ];
    }

    return {
      name: "Claim Governance of CurveUsdcStrategy and set Native USDC",
      actions,
    };
  }
);
