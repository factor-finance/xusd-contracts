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

module.exports = deploymentWithProposal(
  {
    deployName: "013_supportNativeUSDC",
    skip: () => isFuji || isFujiFork,
    tags: ["013"],
  },
  async ({ deployWithConfirmation, ethers }) => {
    const assetAddresses = await getAssetAddresses(hre.deployments);

    // Current contract
    const cVaultProxy = await ethers.getContract("VaultProxy");
    const cVault = await ethers.getContractAt("Vault", cVaultProxy.address);

    let oracleRouter;
    if (isTest) {
      oracleRouter = await ethers.getContract("OracleRouter");
    } else {
      oracleRouter = await deployWithConfirmation("OracleRouter");
      log("Deploying oracleRouter with native stablecoins");
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
