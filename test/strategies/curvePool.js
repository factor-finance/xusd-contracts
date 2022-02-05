const { expect } = require("chai");
const { utils } = require("ethers");

const { curveUsdcVaultFixture } = require("../_fixture");
const {
  daiUnits,
  usdtUnits,
  xusdUnits,
  units,
  loadFixture,
  expectApproxSupply,
  isFork,
} = require("../helpers");

describe("CurveUsdc Strategy", function () {
  if (isFork) {
    this.timeout(0);
  }

  let anna,
    xusd,
    vault,
    governor,
    wavax,
    curveUsdcToken,
    curveUsdcGauge,
    curveUsdcStrategy,
    usdc,
    usdcNative,
    usdt,
    dai;

  const mint = async (amount, asset) => {
    await asset.connect(anna).mint(units(amount, asset));
    await asset.connect(anna).approve(vault.address, units(amount, asset));
    return await vault
      .connect(anna)
      .mint(asset.address, units(amount, asset), 0);
  };

  beforeEach(async function () {
    const fixture = await loadFixture(curveUsdcVaultFixture);
    anna = fixture.anna;
    vault = fixture.vault;
    xusd = fixture.xusd;
    governor = fixture.governor;
    wavax = fixture.wavax;
    curveUsdcToken = fixture.curveUsdcToken;
    curveUsdcGauge = fixture.curveUsdcGauge;
    curveUsdcStrategy = fixture.curveUsdcStrategy;
    usdc = fixture.usdc;
    usdcNative = fixture.usdcNative;

    await vault
      .connect(governor)
      .setAssetDefaultStrategy(usdc.address, curveUsdcStrategy.address);
    await curveUsdcGauge
      .connect(governor) // anyone
      .addRewardToken(wavax.address);
  });

  describe("Mint", function () {
    it("Should stake USDC in Curve gauge via curveUsdc", async function () {
      await expectApproxSupply(xusd, xusdUnits("200"));
      await mint("30000.00", usdc);
      await expectApproxSupply(xusd, xusdUnits("30200"));
      await expect(anna).to.have.a.balanceOf("30000", xusd);
      await expect(curveUsdcGauge).has.an.approxBalanceOf(
        "30000",
        curveUsdcToken
      );
    });

    it("Should stake USDC in Curve gauge via UsdcPool", async function () {
      await expectApproxSupply(xusd, xusdUnits("200"));
      await mint("50000.00", usdc);
      await expectApproxSupply(xusd, xusdUnits("50200"));
      await expect(anna).to.have.a.balanceOf("50000", xusd);
      await expect(curveUsdcGauge).has.an.approxBalanceOf(
        "50000",
        curveUsdcToken
      );
    });

    it("Should use a minimum LP token amount when depositing USDCnative into UsdcPool", async function () {
      await expect(mint("29000", usdcNative)).to.be.revertedWith(
        "Slippage ruined your day"
      );
    });

    it("Should use a minimum LP token amount when depositing USDC into UsdcPool", async function () {
      await expect(mint("29000", usdc)).to.be.revertedWith(
        "Slippage ruined your day"
      );
    });
  });

  describe("Redeem", function () {
    it("Should be able to unstake from gauge and return USDC (native)", async function () {
      await expectApproxSupply(xusd, xusdUnits("200"));
      await mint("10000.00", dai);
      await mint("10000.00", usdc);
      await mint("10000.00", usdcNative);
      await vault.connect(anna).redeem(xusdUnits("20000"), 0);
      await expectApproxSupply(xusd, xusdUnits("10200"));
    });
  });

  describe("Utilities", function () {
    it("Should allow transfer of arbitrary token by Governor", async () => {
      await dai.connect(anna).approve(vault.address, daiUnits("8.0"));
      await vault.connect(anna).mint(dai.address, daiUnits("8.0"), 0);
      // Anna sends her OUSD directly to Strategy
      await xusd
        .connect(anna)
        .transfer(curveUsdcStrategy.address, xusdUnits("8.0"));
      // Anna asks Governor for help
      await curveUsdcStrategy
        .connect(governor)
        .transferToken(xusd.address, xusdUnits("8.0"));
      await expect(governor).has.a.balanceOf("8.0", xusd);
    });

    it("Should not allow transfer of arbitrary token by non-Governor", async () => {
      // Naughty Anna
      await expect(
        curveUsdcStrategy
          .connect(anna)
          .transferToken(xusd.address, xusdUnits("8.0"))
      ).to.be.revertedWith("Caller is not the Governor");
    });

    it("Should allow the strategist to call harvest", async () => {
      await vault.connect(governor).setStrategistAddr(anna.address);
      await vault.connect(anna)["harvest()"]();
    });

    it("Should allow the strategist to call harvest for a specific strategy", async () => {
      // gaugerewarder mints a fixed 2e18
      await vault.connect(governor).setStrategistAddr(anna.address);
      await vault.connect(anna)["harvest(address)"](curveUsdcStrategy.address);
    });

    it("Should collect reward tokens using collect rewards on all strategies", async () => {
      // Mint of MockGause rewards mints a fixed 2e18
      await curveUsdcGauge
        .connect(governor)
        .claim_rewards(curveUsdcStrategy.address, vault.address);
      await vault.connect(governor)["harvest()"]();
      await expect(await wavax.balanceOf(vault.address)).to.be.equal(
        utils.parseUnits("2", 18)
      );
    });

    it("Should collect reward tokens using collect rewards on a specific strategy", async () => {
      // Gauge rewards mints a fixed 2e18
      await curveUsdcGauge
        .connect(governor)
        .claim_rewards(curveUsdcStrategy.address, vault.address);
      await vault.connect(governor)[
        // eslint-disable-next-line
        "harvest(address)"
      ](curveUsdcStrategy.address);
      await expect(await wavax.balanceOf(vault.address)).to.be.equal(
        utils.parseUnits("2", 18)
      );
      await curveUsdcGauge
        .connect(governor)
        .claim_rewards(curveUsdcStrategy.address, vault.address);
      await expect(await wavax.balanceOf(vault.address)).to.be.equal(
        utils.parseUnits("2", 18)
      );
    });

    it("Should collect reward tokens and swap via Pangolin", async () => {
      const mockSwapRouter = await ethers.getContract("MockPangolinRouter");

      mockSwapRouter.initialize(wavax.address, usdt.address);
      await vault.connect(governor).setUniswapAddr(mockSwapRouter.address);

      // Add CRV to the Vault as a token that should be swapped
      await vault.connect(governor).addSwapToken(wavax.address);

      // Make sure Vault has 0 USDC balance
      await expect(vault).has.a.balanceOf("0", usdt);

      // Make sure the Strategy has CRV balance
      await curveUsdcGauge
        .connect(governor)
        .claim_rewards(curveUsdcStrategy.address, vault.address);
      await expect(
        await wavax.balanceOf(await governor.getAddress())
      ).to.be.equal("0");
      await expect(
        await wavax.balanceOf(curveUsdcStrategy.address)
      ).to.be.equal(utils.parseUnits("2", 18));

      // Give Uniswap mock some USDT so it can give it back in WAVAX liquidation
      await usdt
        .connect(anna)
        .transfer(mockSwapRouter.address, usdtUnits("100"));

      // prettier-ignore
      await vault
        .connect(governor)["harvestAndSwap()"]();

      // Make sure Vault has 100 USDT balance (the Uniswap mock converts at 1:1)
      await expect(vault).has.a.balanceOf("2", usdt);

      // No CRV in Vault or Compound strategy
      await expect(vault).has.a.balanceOf("0", wavax);
      await expect(
        await wavax.balanceOf(curveUsdcStrategy.address)
      ).to.be.equal("0");
    });
  });
});
