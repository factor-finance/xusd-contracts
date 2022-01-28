const { deploymentWithProposal, log } = require("../utils/deploy");
const { isFuji } = require("../test/helpers");

module.exports = deploymentWithProposal(
  {
    deployName: "010_precisionUpgrade",
    skip: () => !isFuji, // only run on fuji
  },
  async ({
    assetAddresses,
    deployWithConfirmation,
    ethers,
    getTxOpts,
    withConfirmation,
  }) => {
    // Current contracts
    const cXUSDProxy = await ethers.getContract("XUSDProxy");

    // Deploy new XUSD implementation
    const dXUSDImpl = await deployWithConfirmation("XUSD");

    // Governance Actions
    // ----------------
    return {
      name: "Upgrade to high resolution XUSD balance",
      actions: [
        // 1. XUSDProxy use new implementation
        {
          contract: cXUSDProxy,
          signature: "upgradeTo(address)",
          args: [dXUSDImpl.address],
        },
      ],
    };
  }
);
