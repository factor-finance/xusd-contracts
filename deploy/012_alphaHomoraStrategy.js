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
const addresses = require("../utils/addresses.js");

module.exports = deploymentWithProposal(
  {
    deployName: "012_alphaHomoraStrategy",
    skip: () => isFuji || isFujiFork,
  },
  async ({ deployWithConfirmation, ethers, getTxOpts }) => {
    const { deployerAddr, governorAddr } = await hre.getNamedAccounts();
    const sDeployer = await ethers.provider.getSigner(deployerAddr);
    const assetAddresses = await getAssetAddresses(hre.deployments);

    // Current contract
    const cVaultProxy = await ethers.getContract("VaultProxy");
    const cVault = await ethers.getContractAt("Vault", cVaultProxy.address);

    const dAlphaHomoraStrategyProxy = await deployWithConfirmation(
      "AlphaHomoraStrategyProxy"
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
        deployerAddr,
        []
      )
    );
    log("Initialized AlphaHomoraStrategyProxy");
    const initFunctionName =
      "initialize(address,address,address,address[],address[],address)";
    await withConfirmation(
      cAlphaHomoraStrategy
        .connect(sDeployer)
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
    log("Initialized AlphaHomoraStrategy");

    const dGovernor = await hre.ethers.getContract("Governor");
    // Initiate transfer of ownership to the governor.
    await withConfirmation(
      cAlphaHomoraStrategy
        .connect(sDeployer)
        .transferGovernance(
          isTest ? governorAddr : dGovernor.address,
          await getTxOpts()
        )
    );
    log(`AlphaHomoraStrategy transferGovernance(${governorAddr} called`);

    // Governance Actions
    // ----------------

    let actions;
    actions = [
      // claimGovernance using pending set above.
      {
        contract: cAlphaHomoraStrategy,
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
          args: [cAlphaHomoraStrategyProxy.address],
        },
        // approve strategy
        // initial set USDT.e default
        {
          contract: cVault,
          signature: "setAssetDefaultStrategy(address,address)",
          args: [assetAddresses.USDTe, cAlphaHomoraStrategyProxy.address],
        },
        // change DAIe default
        {
          contract: cVault,
          signature: "setAssetDefaultStrategy(address,address)",
          args: [assetAddresses.DAIe, cAlphaHomoraStrategyProxy.address],
        },
      ];
    }

    return {
      name: "Claim Governance of AlphaHomoraStrategy and setDefault DAIe and USDTe",
      actions,
    };
  }
);
