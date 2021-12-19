const { expect } = require("chai");

const { rebornFixture } = require("../_fixture");
const { loadFixture, isFork, daiUnits, xusdUnits } = require("../helpers");

describe("Reborn Attack Protection", function () {
  if (isFork) {
    this.timeout(0);
  }

  describe("Vault", function () {
    it("Should correctly do accounting when reborn calls mint as different types of addresses", async function () {
      const fixture = await loadFixture(rebornFixture);
      const { dai, xusd, matt, reborner, rebornAttack } = fixture;
      await dai.connect(matt).transfer(reborner.address, daiUnits("4"));
      await reborner.mint();
      await reborner.bye();
      await rebornAttack(true);
      await expect(reborner).to.have.a.balanceOf("2", xusd);
      expect(await xusd.nonRebasingSupply()).to.equal(xusdUnits("2"));
    });

    it("Should correctly do accounting when reborn calls burn as different types of addresses", async function () {
      const fixture = await loadFixture(rebornFixture);
      const { dai, xusd, matt, reborner, rebornAttack } = fixture;
      await dai.connect(matt).transfer(reborner.address, daiUnits("4"));
      await reborner.mint();
      await reborner.bye();
      await rebornAttack(true, 1);
      await expect(reborner).to.have.a.balanceOf("0", xusd);
      expect(await xusd.nonRebasingSupply()).to.equal(xusdUnits("0"));
    });

    it("Should correctly do accounting when reborn calls transfer as different types of addresses", async function () {
      const fixture = await loadFixture(rebornFixture);
      const { dai, xusd, matt, reborner, rebornAttack } = fixture;
      await dai.connect(matt).transfer(reborner.address, daiUnits("4"));
      await reborner.mint();
      await reborner.bye();
      expect(await xusd.nonRebasingSupply()).to.equal(xusdUnits("1"));
      await rebornAttack(true, 2);
      await expect(reborner).to.have.a.balanceOf("0", xusd);
      expect(await xusd.nonRebasingSupply()).to.equal(xusdUnits("0"));
    });

    it("Should have correct balance even after recreating", async function () {
      const { dai, matt, reborner, rebornAttack, xusd } = await loadFixture(
        rebornFixture
      );

      // Mint one XUSD and self-destruct
      await dai.connect(matt).transfer(reborner.address, daiUnits("4"));
      await reborner.mint();
      await expect(reborner).to.have.a.balanceOf("1", xusd);
      await reborner.bye();

      // Recreate the contract at the same address but expect
      // to not have any change in balance (outside constructor)
      await rebornAttack(false);
      await expect(reborner).to.have.a.balanceOf("1", xusd);
      await reborner.mint();
      await expect(reborner).to.have.a.balanceOf("2", xusd);
    });
  });
});
