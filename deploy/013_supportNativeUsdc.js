const {
  deploymentWithProposal,
  log,
  withConfirmation,
} = require("../utils/deploy");
const {
  getAssetAddresses,
  getOracleAddresses,
  isFuji,
  isFujiFork,
  isTest,
} = require("../test/helpers.js");
const addresses = require("../utils/addresses.js");
const { getTxOpts } = require("../utils/tx");

module.exports = deploymentWithProposal(
  {
    deployName: "013_supportNativeUSDC",
    skip: () => isFuji || isFujiFork,
  },
  async ({ deployWithConfirmation, ethers }) => {
    const { deployerAddr } = await hre.getNamedAccounts();
    const sDeployer = await ethers.provider.getSigner(deployerAddr);
    const assetAddresses = await getAssetAddresses(hre.deployments);

    // Current contract
    const cVaultProxy = await ethers.getContract("VaultProxy");
    const cVault = await ethers.getContractAt("Vault", cVaultProxy.address);

    let oracleRouter;
    if (isTest) {
      const oracleAddresses = await getOracleAddresses(deployments);
      oracleRouter = await ethers.getContract("OracleRouter");
      withConfirmation(
        oracleRouter
          .connect(sDeployer)
          .setFeed(
            assetAddresses.USDC_native,
            oracleAddresses.chainlink.USDC_USD
          )
      );
    } else {
      oracleRouter = await deployWithConfirmation("OracleRouter");
      console.log("Deploying oracleRouter with native stablecoins");
    }

    // Governance Actions
    // ----------------
    return {
      name: "Support Native USDC on vault and oracle",
      actions: [
        // deploy new oracle feed, required for supportAsset
        {
          contract: cVault,
          signature: "setPriceProvider(address)",
          args: [oracleRouter.address],
        },
        // add USDC_native
        {
          contract: cVault,
          signature: "supportAsset(address)",
          args: [assetAddresses.USDC_native],
        },
      ],
    };
  }
);
