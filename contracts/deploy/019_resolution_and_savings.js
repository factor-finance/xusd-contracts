const { deploymentWithProposal } = require("../utils/deploy");

module.exports = deploymentWithProposal(
  { deployName: "019_resolution_and_savings" },
  async ({ ethers, deployWithConfirmation }) => {
    // Deployments
    const dXUSD = await deployWithConfirmation("XUSD");
    const dVaultCore = await deployWithConfirmation("VaultCore");

    // Governance proposal
    const cXUSDProxy = await ethers.getContract("XUSDProxy");
    const cVaultProxy = await ethers.getContract("VaultProxy");
    return {
      name: "Upgrade XUSD resolution for new contracts, redeem gas savings",
      actions: [
        {
          contract: cXUSDProxy,
          signature: "upgradeTo(address)",
          args: [dXUSD.address],
        },
        {
          contract: cVaultProxy,
          signature: "upgradeTo(address)",
          args: [dVaultCore.address],
        },
      ],
    };
  }
);
