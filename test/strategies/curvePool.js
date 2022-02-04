const { expect } = require("chai");
const { utils } = require("ethers");

const { curveUsdcVaultFixture } = require("../_fixture");
const {
  daiUnits,
  usdcNativeUnits,
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
    crv,
    crvMinter,
    curveUsdcToken,
    curveUsdcGauge,
    curveUsdcStrategy,
    usdc,
    usdcNative,
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
    crv = fixture.crv;
    crvMinter = fixture.crvMinter;
    curveUsdcToken = fixture.curveUsdcToken;
    curveUsdcGauge = fixture.curveUsdcGauge;
    curveUsdcStrategy = fixture.curveUsdcStrategy;
    usdc = fixture.usdc;
    usdcNative = fixture.usdcNative;

    await vault
      .connect(governor)
      .setAssetDefaultStrategy(usdc.address, curveUsdcStrategy.address);
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

    it("Should stake USDC in Curve gauge via 3pool", async function () {
      await expectApproxSupply(xusd, xusdUnits("200"));
      await mint("50000.00", usdc);
      await expectApproxSupply(xusd, xusdUnits("50200"));
      await expect(anna).to.have.a.balanceOf("50000", xusd);
      await expect(curveUsdcGauge).has.an.approxBalanceOf(
        "50000",
        curveUsdcToken
      );
    });

    it("Should use a minimum LP token amount when depositing USDCNATIVE into 3pool", async function () {
      await expect(mint("29000", usdcNative)).to.be.revertedWith(
        "Slippage ruined your day"
      );
    });

    it("Should use a minimum LP token amount when depositing USDC into 3pool", async function () {
      await expect(mint("29000", usdc)).to.be.revertedWith(
        "Slippage ruined your day"
      );
    });
  });

  describe("Redeem", function () {
    it("Should be able to unstake from gauge and return USDCNATIVE", async function () {
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
      // Mint of MockCRVMinter mints a fixed 2e18
      await vault.connect(governor).setStrategistAddr(anna.address);
      await vault.connect(anna)["harvest(address)"](curveUsdcStrategy.address);
    });

    it("Should collect reward tokens using collect rewards on all strategies", async () => {
      // Mint of MockCRVMinter mints a fixed 2e18
      await crvMinter.connect(governor).mint(curveUsdcStrategy.address);
      await vault.connect(governor)["harvest()"]();
      await expect(await crv.balanceOf(vault.address)).to.be.equal(
        utils.parseUnits("2", 18)
      );
    });

    it("Should collect reward tokens using collect rewards on a specific strategy", async () => {
      // Mint of MockCRVMinter mints a fixed 2e18
      await crvMinter.connect(governor).mint(curveUsdcStrategy.address);
      await vault.connect(governor)[
        // eslint-disable-next-line
        "harvest(address)"
      ](curveUsdcStrategy.address);
      await expect(await crv.balanceOf(vault.address)).to.be.equal(
        utils.parseUnits("2", 18)
      );
      await crvMinter.connect(governor).mint(curveUsdcStrategy.address);
      await expect(await crv.balanceOf(vault.address)).to.be.equal(
        utils.parseUnits("2", 18)
      );
    });

    it("Should collect reward tokens and swap via Uniswap", async () => {
      const mockUniswapRouter = await ethers.getContract("MockUniswapRouter");

      mockUniswapRouter.initialize(crv.address, usdcNative.address);
      await vault.connect(governor).setUniswapAddr(mockUniswapRouter.address);

      // Add CRV to the Vault as a token that should be swapped
      await vault.connect(governor).addSwapToken(crv.address);

      // Make sure Vault has 0 USDCNATIVE balance
      await expect(vault).has.a.balanceOf("0", usdcNative);

      // Make sure the Strategy has CRV balance
      await crvMinter.connect(governor).mint(curveUsdcStrategy.address);
      await expect(
        await crv.balanceOf(await governor.getAddress())
      ).to.be.equal("0");
      await expect(await crv.balanceOf(curveUsdcStrategy.address)).to.be.equal(
        utils.parseUnits("2", 18)
      );

      // Give Uniswap mock some USDCNATIVE so it can give it back in CRV liquidation
      await usdcNative
        .connect(anna)
        .transfer(mockUniswapRouter.address, usdcNativeUnits("100"));

      // prettier-ignore
      await vault
        .connect(governor)["harvestAndSwap()"]();

      // Make sure Vault has 100 USDCNATIVE balance (the Uniswap mock converts at 1:1)
      await expect(vault).has.a.balanceOf("2", usdcNative);

      // No CRV in Vault or Compound strategy
      await expect(vault).has.a.balanceOf("0", crv);
      await expect(await crv.balanceOf(curveUsdcStrategy.address)).to.be.equal(
        "0"
      );
    });
  });
});
