const { deploymentWithProposal, log } = require("../utils/deploy");
const {
  isTest,
  isSmokeTest,
  isFuji,
  isFujiFork,
  isMainnet,
  isMainnetFork,
} = require("../test/helpers.js");
const addresses = require("../utils/addresses.js");

module.exports = deploymentWithProposal(
  {
    deployName: "011_vaultAdminUpgrade",
    skip: () => isTest || isSmokeTest, // only on mainnet and fuji
  },
  async ({ deployWithConfirmation, ethers }) => {
    let wavaxAddr;
    if (isMainnet || isMainnetFork) {
      wavaxAddr = addresses.mainnet.WAVAX;
    } else if (isFuji || isFujiFork) {
      wavaxAddr = addresses.fuji.WAVAX;
    }

    // Current contract
    const cVaultProxy = await ethers.getContract("VaultProxy");
    const cVault = await ethers.getContractAt("Vault", cVaultProxy.address);

    // Deploy new VaultAdult implementation
    const dVaultAdmin = await deployWithConfirmation("VaultAdmin");
    log("Deployed new VaultAdmin", dVaultAdmin.address);
    // Governance Actions
    // ----------------
    return {
      name: "Upgrade VaultAdmin swap routing",
      actions: [
        // 1. Vault use new vaultAdmin implementation
        {
          contract: cVault,
          signature: "setAdminImpl(address)",
          args: [dVaultAdmin.address],
        },
        // 2. Vault swaps WAVAX
        {
          contract: cVault,
          signature: "addSwapToken(address)",
          args: [wavaxAddr],
        },
      ],
    };
  }
);
