const { deploymentWithProposal } = require("../utils/deploy");

module.exports = deploymentWithProposal(
  { deployName: "024_resolution_upgrade_start", forceDeploy: false },
  async ({ ethers, deployWithConfirmation }) => {
    const dXUSDResolutionUpgrade = await deployWithConfirmation(
      "XUSDResolutionUpgrade"
    );
    const cXUSDProxy = await ethers.getContract("XUSDProxy");

    // Deployments
    const cVaultProxy = await ethers.getContract("VaultProxy");
    const cVaultAdmin = await ethers.getContractAt(
      "VaultAdmin",
      cVaultProxy.address
    );

    // Governance proposal
    return {
      name: "Switch XUSD into resolution upgrade mode",
      actions: [
        {
          contract: cXUSDProxy,
          signature: "upgradeTo(address)",
          args: [dXUSDResolutionUpgrade.address],
        },
        {
          contract: cVaultAdmin,
          signature: "pauseCapital()",
          args: [],
        },
      ],
    };
  }
);
