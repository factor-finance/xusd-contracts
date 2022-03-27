const { deploymentWithProposal } = require("../utils/deploy");
const {
  isTest,
  isFuji,
  isFujiFork,
  isMainnet,
  isMainnetFork,
  getAssetAddresses,
} = require("../test/helpers.js");
const addresses = require("../utils/addresses.js");

module.exports = deploymentWithProposal(
  {
    deployName: "017_addSwapTokens",
    skip: () => isFuji || isFujiFork || isTest, // only on mainnet
  },
  async ({ deployWithConfirmation, ethers }) => {
    const assetAddresses = await getAssetAddresses(deployments);

    // Current contract
    const cVaultProxy = await ethers.getContract("VaultProxy");
    const cVault = await ethers.getContractAt("Vault", cVaultProxy.address);

    console.log(`Deploying oracleRouter`);
    const oracleRouter = await deployWithConfirmation("OracleRouter", []);

    // Governance Actions
    // ----------------
    return {
      name: "addSwapToken for new multi-rewards with oracle support",
      actions: [
        // 1. set new oracle feed on vault
        {
          contract: cVault,
          signature: "setPriceProvider(address)",
          args: [oracleRouter.address],
        },
        // 2. Vault swaps ALPHA
        {
          contract: cVault,
          signature: "addSwapToken(address)",
          args: [assetAddresses.ALPHA],
        },
        // 3. Vault swaps CRV
        {
          contract: cVault,
          signature: "addSwapToken(address)",
          args: [assetAddresses.CRV],
        },
      ],
    };
  }
);
