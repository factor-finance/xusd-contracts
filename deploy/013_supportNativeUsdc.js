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
    deployName: "013_supportNativeUSDC",
    skip: () => isFuji || isFujiFork,
  },
  async ({ deployWithConfirmation, ethers }) => {
    const { deployerAddr, governorAddr } = await hre.getNamedAccounts();
    const sDeployer = await ethers.provider.getSigner(deployerAddr);
    const assetAddresses = await getAssetAddresses(hre.deployments);

    // Current contract
    const cVaultProxy = await ethers.getContract("VaultProxy");
    const cVault = await ethers.getContractAt("Vault", cVaultProxy.address);

    // Governance Actions
    // ----------------
    return {
      name: "Support Native USDC on vault and oracle",
      actions: [
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
