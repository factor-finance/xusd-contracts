const { expect } = require("chai");
const { utils } = require("ethers");

const { BigNumber } = require("ethers");
const { curveUsdcPoolFixture } = require("../_fixture");
const { loadFixture, units } = require("../helpers");

describe("3Pool Strategy Standalone", function () {
  let governor,
    curveUsdcPool,
    curveUsdcToken,
    curvePoolStrategy,
    curveUsdcGauge,
    tpStandalone,
    usdc,
    usdcNative,
    dai,
    anna;

  beforeEach(async function () {
    ({
      governor,
      curveUsdcPool,
      curveUsdcToken,
      curveUsdcGauge,
      tpStandalone,
      usdc,
      usdcNative,
      dai,
      anna,
    } = await loadFixture(curveUsdcPoolFixture));
    curvePoolStrategy = tpStandalone.connect(governor);
  });

  const deposit = async (amount, asset) => {
    await asset
      .connect(governor)
      .transfer(curvePoolStrategy.address, units(amount, asset));
    await curvePoolStrategy.deposit(asset.address, units(amount, asset));
  };

  it("Should deposit all", async function () {
    await usdcNative
      .connect(governor)
      .transfer(curvePoolStrategy.address, units("100", usdcNative));
    await usdc
      .connect(governor)
      .transfer(curvePoolStrategy.address, units("300", usdc));
    await curvePoolStrategy.depositAll();
    await expect(await curveUsdcGauge.balanceOf(curvePoolStrategy.address)).eq(
      utils.parseUnits("400", 18)
    );
  });

  it("Should withdraw all", async function () {
    const governorAddress = await governor.getAddress();
    const governorUsdcNative = await usdcNative.balanceOf(governorAddress);
    const governorUsdc = await usdc.balanceOf(governorAddress);

    await dai
      .connect(governor)
      .transfer(curvePoolStrategy.address, units("100", dai));
    await usdcNative
      .connect(governor)
      .transfer(curvePoolStrategy.address, units("200", usdcNative));
    await usdc
      .connect(governor)
      .transfer(curvePoolStrategy.address, units("300", usdc));
    await curvePoolStrategy.depositAll();

    await expect(await usdcNative.balanceOf(governorAddress)).eq(
      governorUsdcNative.sub(await units("200", usdcNative))
    );
    await expect(await usdc.balanceOf(governorAddress)).eq(
      governorUsdc.sub(await units("300", usdc))
    );

    // NOTE tpStandlone configures Governor as the Vault
    // Withdraw everything from curve pool. which will unstake from Gauge and return
    // assets to Governor
    await curvePoolStrategy.withdrawAll();

    // Check balances of Governor, withdrawn assets reside here
    await expect(await usdcNative.balanceOf(governorAddress)).eq(
      governorUsdcNative
    );
    await expect(await usdc.balanceOf(governorAddress)).eq(governorUsdc);
  });

  it("Should allow safeApproveAllTokens to be called", async function () {
    const MAX = BigNumber.from(
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    );
    const expectAllowanceRaw = async (expected, asset, owner, spender) => {
      const allowance = await asset.allowance(owner.address, spender.address);
      await expect(allowance).to.eq(expected);
    };

    await expectAllowanceRaw(MAX, usdc, curvePoolStrategy, curveUsdcPool);
    await expectAllowanceRaw(
      MAX,
      curveUsdcToken,
      curvePoolStrategy,
      curveUsdcPool
    );
    await expectAllowanceRaw(
      MAX,
      curveUsdcToken,
      curvePoolStrategy,
      curveUsdcGauge
    );

    await deposit("150", usdc);
    await expectAllowanceRaw(
      MAX.sub((await units("150.0", usdc)).toString()),
      usdc,
      curvePoolStrategy,
      curveUsdcPool
    );

    await curvePoolStrategy.safeApproveAllTokens();
    await expectAllowanceRaw(MAX, usdc, curvePoolStrategy, curveUsdcPool);
    await expectAllowanceRaw(
      MAX,
      curveUsdcToken,
      curvePoolStrategy,
      curveUsdcPool
    );
    await expectAllowanceRaw(
      MAX,
      curveUsdcToken,
      curvePoolStrategy,
      curveUsdcGauge
    );
  });

  it("Should read reward liquidation threshold", async () => {
    expect(await tpStandalone.rewardLiquidationThreshold()).to.equal("0");
  });

  it("Should allow Governor to set reward liquidation threshold", async () => {
    await tpStandalone
      .connect(governor)
      .setRewardLiquidationThreshold(utils.parseUnits("1", 18));
    expect(await tpStandalone.rewardLiquidationThreshold()).to.equal(
      utils.parseUnits("1", 18)
    );
  });

  it("Should not allow non-Governor to set reward liquidation threshold", async () => {
    await expect(
      tpStandalone
        .connect(anna)
        .setRewardLiquidationThreshold(utils.parseUnits("10", 18))
    ).to.be.revertedWith("Caller is not the Governor");
  });
});
