const {
  deploymentWithProposal,
  log,
  withConfirmation,
} = require("../utils/deploy");
const { getAssetAddresses, isFuji, isFujiFork } = require("../test/helpers.js");
const addresses = require("../utils/addresses.js");
const { getTxOpts } = require("../utils/tx");

module.exports = deploymentWithProposal(
  {
    deployName: "013_curveUsdcPairStrategy",
    skip: () => isFuji || isFujiFork,
  },
  async ({ deployWithConfirmation, ethers }) => {
    const { deployerAddr, governorAddr } = await hre.getNamedAccounts();
    const sDeployer = await ethers.provider.getSigner(deployerAddr);
    const assetAddresses = await getAssetAddresses(hre.deployments);

    // Current contract
    const cVaultProxy = await ethers.getContract("VaultProxy");

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
        [
          "initialize(address,address,address,address[],address[],address,address)"
        ](
          assetAddresses.CurveUsdcPool,
          cVaultProxy.address,
          assetAddresses.CRV,
          [assetAddresses.USDC, assetAddresses.USDC_native],
          [assetAddresses.CurveUsdcToken, assetAddresses.CurveUsdcToken],
          assetAddresses.CurveUsdcPoolGauge,
          // FIXME: do we use minter with this interface on avax?
          assetAddresses.CRVMinter
        )
    );
    log("Initialized CurveUsdcStrategy");

    // Initiate transfer of ownership to the governor.
    await withConfirmation(
      cCurveUsdcStrategy
        .connect(sDeployer)
        .transferGovernance(governorAddr, await getTxOpts())
    );
    log(`CurveUsdcStrategy transferGovernance(${governorAddr} called`);

    // Governance Actions
    // ----------------
    return {
      name: "Claim Governance of CurveUsdcStrategy",
      actions: [
        // claimGovernance using pending set above.
        {
          contract: cCurveUsdcStrategy,
          signature: "claimGovernance()",
          args: [],
        },
      ],
    };
  }
);
