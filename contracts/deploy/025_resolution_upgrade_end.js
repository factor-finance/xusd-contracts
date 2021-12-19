const { deploymentWithProposal } = require("../utils/deploy");

module.exports = deploymentWithProposal(
  { deployName: "025_resolution_upgrade_start", forceDeploy: false },
  async ({ ethers, deployWithConfirmation }) => {
    const dXUSDImpl = await deployWithConfirmation(
      "XUSD",
      undefined,
      undefined,
      true
    );
    const cXUSDProxy = await ethers.getContract("XUSDProxy");

    // Governance proposal
    return {
      name: "Activate XUSD after resolution upgrade complete",
      actions: [
        {
          contract: cXUSDProxy,
          signature: "upgradeTo(address)",
          args: [dXUSDImpl.address],
        },
      ],
    };
  }
);
