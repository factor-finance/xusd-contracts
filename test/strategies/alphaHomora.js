const { expect } = require("chai");
const { utils } = require("ethers");

const { alphaHomoraVaultFixture } = require("../_fixture");
const {
  daiUnits,
  xusdUnits,
  units,
  loadFixture,
  expectApproxSupply,
  isFork,
} = require("../helpers");

describe("AlphaHomora Strategy", function () {
  if (isFork) {
    this.timeout(0);
  }

  let anna,
    xusd,
    vault,
    governor,
    creamDAIe,
    daiSafeBox,
    alphaHomoraStrategy,
    usdt,
    usdc,
    dai;

  const mint = async (amount, asset) => {
    await asset.connect(anna).mint(units(amount, asset));
    await asset.connect(anna).approve(vault.address, units(amount, asset));
    await vault.connect(anna).mint(asset.address, units(amount, asset), 0);
  };

  beforeEach(async function () {
    const fixture = await loadFixture(alphaHomoraVaultFixture);
    anna = fixture.anna;
    vault = fixture.vault;
    xusd = fixture.xusd;
    governor = fixture.governor;
    alphaHomoraStrategy = fixture.alphaHomoraStrategy;
    daiSafeBox = fixture.daiSafeBox;
    creamDAIe = fixture.creamDAIe;
    usdt = fixture.usdt;
    usdc = fixture.usdc;
    dai = fixture.dai;
  });

  describe("Mint", function () {
    it("Should be able to mint DAI and it show up in SafeBox", async function () {
      // we already have 200 dai in vault
      await expectApproxSupply(xusd, xusdUnits("200"));
      await expect(vault).has.an.approxBalanceOf("200", dai);
      await expect(creamDAIe).has.an.approxBalanceOf("0", dai);
      await expect(daiSafeBox).has.an.approxBalanceOf("0", dai);
      await mint("30000.00", dai);
      await expectApproxSupply(xusd, xusdUnits("30200"));
      // should allocate all of it to strategy
      await expect(creamDAIe).to.have.a.balanceOf("30200", dai);
      await expect(anna).to.have.a.balanceOf("30000", xusd);
      await expect(alphaHomoraStrategy).to.have.a.balanceOf(
        "30200",
        daiSafeBox
      );
      expect(
        await daiSafeBox.balanceOf(alphaHomoraStrategy.address)
      ).to.be.equal(utils.parseUnits("30200", 18));
    });

    it("Should be able to mint and redeem DAI", async function () {
      await expectApproxSupply(xusd, xusdUnits("200"));
      await mint("30000.00", dai);
      await vault.connect(anna).redeem(xusdUnits("20000"), 0);
      await expectApproxSupply(xusd, xusdUnits("10200"));
      // Anna started with 1000 DAI
      await expect(anna).to.have.a.balanceOf("21000", dai);
      await expect(anna).to.have.a.balanceOf("10000", xusd);
    });

    it("Should be able to withdrawAll", async function () {
      await expectApproxSupply(xusd, xusdUnits("200"));
      await mint("30000.00", dai);
      await vault
        .connect(governor)
        .withdrawAllFromStrategy(alphaHomoraStrategy.address);
      await expect(alphaHomoraStrategy).to.have.a.balanceOf("0", dai);
    });

    it("Should be able to withdraw", async function () {
      await expectApproxSupply(xusd, xusdUnits("200"));
      await mint("30000.00", dai);
      await vault
        .connect(governor)
        .withdrawAllFromStrategy(alphaHomoraStrategy.address);
      await expect(alphaHomoraStrategy).to.have.a.balanceOf("0", dai);
    });

    it("Should be able to withdraw with changed exchangeRate", async function () {
      await expectApproxSupply(xusd, xusdUnits("200"));
      await mint("30000.00", dai);
      await creamDAIe.setMockExchangeRate();
      await vault
        .connect(governor)
        .withdrawAllFromStrategy(alphaHomoraStrategy.address);
      await expect(alphaHomoraStrategy).to.have.a.balanceOf("0", dai);
    });

    it("Should be able to redeem and return assets after multiple mints", async function () {
      await mint("30000.00", usdt);
      await mint("30000.00", usdc);
      await mint("30000.00", dai);
      await vault.connect(anna).redeem(xusdUnits("60000.00"), 0);
      // Anna had 1000 of each asset before the mints
      // 200 DAI was already in the Vault
      // 30200 DAI, 30000 USDT, 30000 USDC
      // 30200 / 90200 * 30000 + 1000 DAI
      // 30000 / 90200 * 30000 + 1000 USDC and USDT
      await expect(anna).to.have.an.approxBalanceOf("21088.69", dai);
      await expect(anna).to.have.an.approxBalanceOf("20955.65", usdc);
      await expect(anna).to.have.an.approxBalanceOf("20955.65", usdt);
      await expectApproxSupply(xusd, xusdUnits("30200"));
    });

    it("Should allow transfer of arbitrary token by Governor", async () => {
      await dai.connect(anna).approve(vault.address, daiUnits("8.0"));
      await vault.connect(anna).mint(dai.address, daiUnits("8.0"), 0);
      // Anna sends her XUSD directly to Strategy
      await xusd
        .connect(anna)
        .transfer(alphaHomoraStrategy.address, xusdUnits("8.0"));
      // Anna asks Governor for help
      await alphaHomoraStrategy
        .connect(governor)
        .transferToken(xusd.address, xusdUnits("8.0"));
      await expect(governor).has.a.balanceOf("8.0", xusd);
    });

    it("Should not allow transfer of arbitrary token by non-Governor", async () => {
      // Naughty Anna
      await expect(
        alphaHomoraStrategy
          .connect(anna)
          .transferToken(xusd.address, xusdUnits("8.0"))
      ).to.be.revertedWith("Caller is not the Governor");
    });
  });

  describe("Rewards", function () {
    const REWARD_AMOUNT = "70000000000";

    const collectRewards = function (setupOpts, verificationOpts) {
      return async function () {
        const fixture = await loadFixture(alphaHomoraVaultFixture);
        const alphaHomoraStrategy = fixture.alphaHomoraStrategy;
        const alphaHomoraIncentives = [
          fixture.alphaHomoraIncentivesControllerALPHA,
          fixture.alphaHomoraIncentivesControllerWAVAX,
        ];
        const alphaToken = fixture.alphaToken;
        const vault = fixture.vault;
        const governor = fixture.governor;

        let { hasRewards } = setupOpts;
        // Options
        let rewardsAmount = hasRewards ? REWARD_AMOUNT : 0;

        // Configure
        // ----

        // Setup for test
        // ----
        if (rewardsAmount > 0) {
          await alphaHomoraStrategy.connect(governor).setProofAndAmount(
            alphaToken.address,
            [
              // just some random bytes
              "0x05416460deb76d57af601be17e777b93592d8d4d4a4096c57876a91c84f4a712",
            ],
            rewardsAmount
          );
          await alphaHomoraIncentives[0].setRewardBalance(
            alphaHomoraStrategy.address,
            rewardsAmount
          );
          await alphaHomoraIncentives[0].setVault(vault.address);
          await alphaHomoraIncentives[1].setRewardBalance(
            alphaHomoraStrategy.address,
            "0"
          );
          await alphaHomoraIncentives[1].setVault(vault.address);
        }
        const stratAlphaRewardBalance =
          await alphaHomoraIncentives[0].getRewardBalance(
            alphaHomoraStrategy.address
          );
        expect(stratAlphaRewardBalance).to.be.equal(
          rewardsAmount,
          "ALPHAHOMORA:Strategy"
        );

        // Run
        // ----
        await vault.connect(governor)["harvest()"]();

        // Verification
        // ----
        const { shouldClaimRewards } = verificationOpts;
        let verifyRewardsAmount = shouldClaimRewards ? 0 : rewardsAmount;

        const verifyVaultAlphaHomora = await alphaToken.balanceOf(
          vault.address
        );
        const verifyStratAlphaHomora = await alphaToken.balanceOf(
          alphaHomoraStrategy.address
        );
        expect(verifyVaultAlphaHomora).to.equal(
          rewardsAmount,
          "ALPHAHOMORA:Vault"
        );

        expect(verifyStratAlphaHomora).to.be.equal(
          verifyRewardsAmount,
          "ALPHAHOMORA:Strategy"
        );
      };
    };

    it(
      "Has pending rewards",
      collectRewards(
        {
          hasRewards: true,
        },
        {
          shouldClaimRewards: true,
        }
      )
    );
    it(
      "No pending rewards",
      collectRewards(
        {
          hasRewards: false,
        },
        {
          shouldClaimRewards: false,
        }
      )
    );
  });
});
