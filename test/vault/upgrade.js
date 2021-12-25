const { expect } = require("chai");
const { defaultFixture } = require("../_fixture");
const { loadFixture } = require("../helpers");

describe("VaultAdmin Upgrades", async function () {
  let xusd, vault, vaultStorage, governor;

  beforeEach(async function () {
    const fixture = await loadFixture(defaultFixture);
    vault = fixture.vault;
    xusd = fixture.xusd;
    governor = fixture.governor;
    vaultStorage = await hre.ethers.getContractAt(
      "VaultStorage",
      vault.address
    );
  });

  it("should upgrade to a new admin implementation", async function () {
    const newVaultImpl = xusd.address; // ;)
    await vaultStorage.connect(governor).setAdminImpl(newVaultImpl);
  });

  it("should not upgrade to a non-contract admin implementation", async function () {
    const blankImpl = "0x4000000000000000000000000000000000000004";
    await expect(
      vaultStorage.connect(governor).setAdminImpl(blankImpl)
    ).to.be.revertedWith("new implementation is not a contract");
  });
});
