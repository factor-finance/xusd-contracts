const { aaveVaultFixture, multiStrategyVaultFixture } = require("../_fixture");
const { expect } = require("chai");
const { utils } = require("ethers");

const { getOracleAddresses } = require("../helpers");

const {
  advanceTime,
  xusdUnits,
  daiUnits,
  usdcUnits,
  usdtUnits,
  tusdUnits,
  setOracleTokenPriceUsd,
  loadFixture,
  isFork,
  expectApproxSupply,
} = require("../helpers");
const addresses = require("../../utils/addresses");

describe("Vault with Aave strategy", function () {
  if (isFork) {
    this.timeout(0);
  }

  let anna,
    matt,
    josh,
    xusd,
    vault,
    governor,
    aaveStrategy,
    usdt,
    usdc,
    dai,
    tusd,
    wavax,
    nonStandardToken,
    oracleRouter,
    aaveIncentivesController;

  beforeEach(async function () {
    const fixture = await aaveVaultFixture();
    governor = fixture.governor;
    aaveStrategy = fixture.aaveStrategy;
    anna = fixture.anna;
    matt = fixture.matt;
    josh = fixture.josh;
    vault = fixture.vault;
    xusd = fixture.xusd;
    usdt = fixture.usdt;
    usdc = fixture.usdc;
    dai = fixture.dai;
    tusd = fixture.tusd;
    wavax = fixture.wavax;
    nonStandardToken = fixture.nonStandardToken;
    oracleRouter = fixture.oracleRouter;
    aaveIncentivesController = fixture.aaveIncentivesController;
  });

  it("Governor can call removePToken", async () => {
    // const { governor, aaveStrategy } = await loadFixture(aaveVaultFixture);
    const tx = await aaveStrategy.connect(governor).removePToken(0);
    const receipt = await tx.wait();

    const event = receipt.events.find((e) => e.event === "PTokenRemoved");
    expect(event).to.not.be.undefined;
  });

  it("Governor can call setPTokenAddress", async () => {
    await expect(
      aaveStrategy.connect(matt).setPTokenAddress(xusd.address, dai.address)
    ).to.be.revertedWith("Caller is not the Governor");
  });

  it("Only Vault can call collectRewardToken", async () => {
    await expect(
      aaveStrategy.connect(matt).collectRewardToken()
    ).to.be.revertedWith("Caller is not the Vault");
  });

  it("Should allocate unallocated assets", async () => {
    await dai.connect(anna).transfer(vault.address, daiUnits("100"));
    await usdc.connect(anna).transfer(vault.address, usdcUnits("200"));
    await usdt.connect(anna).transfer(vault.address, usdtUnits("300"));
    await tusd.connect(anna).transfer(vault.address, tusdUnits("400"));

    await expect(vault.connect(governor).allocate())
      .to.emit(vault, "AssetAllocated")
      .withArgs(dai.address, aaveStrategy.address, daiUnits("300"))
      .to.emit(vault, "AssetAllocated")
      .withArgs(usdc.address, aaveStrategy.address, usdcUnits("200"))
      .to.emit(vault, "AssetAllocated")
      .withArgs(usdt.address, aaveStrategy.address, usdcUnits("300"));
    /*
      TODO: There does not appear to be any support for .withoutArgs to verify
      that this event doesn't get emitted.
      .to.emit(vault, "AssetAllocated")
      .withoutArgs(usdt.address, aaveStrategy.address, tusdUnits("400"));
    */

    // Note aaveVaultFixture sets up with 200 DAI already in the Strategy
    // 200 + 100 = 300
    await expect(await aaveStrategy.checkBalance(dai.address)).to.approxEqual(
      daiUnits("300")
    );
    await expect(await aaveStrategy.checkBalance(usdc.address)).to.approxEqual(
      usdcUnits("200")
    );
    await expect(await aaveStrategy.checkBalance(usdt.address)).to.approxEqual(
      usdtUnits("300")
    );

    // Strategy doesn't support TUSD
    // Vault balance for TUSD should remain unchanged
    await expect(await tusd.balanceOf(vault.address)).to.equal(
      tusdUnits("400")
    );
  });

  it("Should correctly handle a deposit of USDC (6 decimals)", async function () {
    await expect(anna).has.a.balanceOf("0", xusd);
    // The mint process maxes out at a 1.0 price
    await setOracleTokenPriceUsd("USDC", "1.25");
    await usdc.connect(anna).approve(vault.address, usdcUnits("50"));
    await vault.connect(anna).mint(usdc.address, usdcUnits("50"), 0);
    await expect(anna).has.a.balanceOf("50", xusd);
  });

  it("Should allow withdrawals", async () => {
    await expect(anna).has.a.balanceOf("1000.00", usdc);
    await usdc.connect(anna).approve(vault.address, usdcUnits("50.0"));
    await vault.connect(anna).mint(usdc.address, usdcUnits("50.0"), 0);
    await expect(anna).has.a.balanceOf("50.00", xusd);

    await vault.connect(governor).allocate();

    // Verify the deposit went to Aave
    expect(await aaveStrategy.checkBalance(usdc.address)).to.approxEqual(
      usdcUnits("50.0")
    );

    // Note Anna will have slightly less than 50 due to deposit to Aave
    // according to the MockCToken implementation
    await xusd.connect(anna).approve(vault.address, xusdUnits("40.0"));
    await vault.connect(anna).redeem(xusdUnits("40.0"), 0);

    await expect(anna).has.an.approxBalanceOf("10", xusd);
    // Vault has 200 DAI and 50 USDC, 50/250 * 40 USDC will come back
    await expect(anna).has.an.approxBalanceOf("958", usdc);
  });

  it("Should calculate the balance correctly with DAI in strategy", async () => {
    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("200", 18)
    );

    // Josh deposits DAI, 18 decimals
    await dai.connect(josh).approve(vault.address, daiUnits("22.0"));
    await vault.connect(josh).mint(dai.address, daiUnits("22.0"), 0);

    await vault.connect(governor).allocate();

    // Josh had 1000 DAI but used 100 DAI to mint XUSD in the fixture
    await expect(josh).has.an.approxBalanceOf("878.0", dai, "Josh has less");

    // Verify the deposit went to Aave (as well as existing Vault assets)
    expect(await aaveStrategy.checkBalance(dai.address)).to.approxEqual(
      daiUnits("222")
    );

    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("222", 18)
    );
  });

  it("Should calculate the balance correctly with USDC in strategy", async () => {
    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("200", 18)
    );

    // Matt deposits USDC, 6 decimals
    await usdc.connect(matt).approve(vault.address, usdcUnits("8.0"));
    await vault.connect(matt).mint(usdc.address, usdcUnits("8.0"), 0);

    await vault.connect(governor).allocate();

    // Verify the deposit went to Aave
    await expect(matt).has.an.approxBalanceOf("992.0", usdc, "Matt has less");

    expect(await aaveStrategy.checkBalance(usdc.address)).to.approxEqual(
      usdcUnits("8.0")
    );

    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("208", 18)
    );
  });

  it("Should calculate the balance correct with TUSD in Vault and DAI, USDC, USDT in Aave strategy", async () => {
    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("200", 18)
    );

    // Josh deposits DAI, 18 decimals
    await dai.connect(josh).approve(vault.address, daiUnits("22.0"));
    await vault.connect(josh).mint(dai.address, daiUnits("22.0"), 0);
    await vault.connect(governor).allocate();
    // Existing 200 also ends up in strategy due to allocate call
    expect(await aaveStrategy.checkBalance(dai.address)).to.approxEqual(
      daiUnits("222")
    );
    // Matt deposits USDC, 6 decimals
    await usdc.connect(matt).approve(vault.address, usdcUnits("8.0"));
    await vault.connect(matt).mint(usdc.address, usdcUnits("8.0"), 0);
    await vault.connect(governor).allocate();
    expect(await aaveStrategy.checkBalance(usdc.address)).to.approxEqual(
      usdcUnits("8.0")
    );
    // Anna deposits USDT, 6 decimals
    await usdt.connect(anna).approve(vault.address, usdtUnits("10.0"));
    await vault.connect(anna).mint(usdt.address, usdtUnits("10.0"), 0);
    await vault.connect(governor).allocate();
    expect(await aaveStrategy.checkBalance(usdt.address)).to.approxEqual(
      usdtUnits("10.0")
    );
    // Matt deposits TUSD, 18 decimals
    await tusd.connect(matt).approve(vault.address, tusdUnits("9.0"));
    await vault.connect(matt).mint(tusd.address, tusdUnits("9.0"), 0);

    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("249", 18)
    );
  });

  it("Should correctly rebase with changes in Aave exchange rates", async () => {
    // Mocks can't handle increasing time
    if (!isFork) return;

    await expect(await vault.totalValue()).to.equal(
      utils.parseUnits("200", 18)
    );
    await dai.connect(matt).approve(vault.address, daiUnits("100"));
    await vault.connect(matt).mint(dai.address, daiUnits("100"), 0);

    await vault.connect(governor).allocate();

    await expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("300", 18)
    );

    // Advance one year
    await advanceTime(365 * 24 * 24 * 60);

    // Rebase XUSD
    await vault.rebase();

    // Expect a yield > 2%
    await expect(await vault.totalValue()).gt(utils.parseUnits("306", 18));
  });

  it("Should correctly withdrawAll all assets in Aave strategy", async () => {
    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("200", 18)
    );

    // Matt deposits USDC, 6 decimals
    await usdc.connect(matt).approve(vault.address, usdcUnits("8.0"));
    await vault.connect(matt).mint(usdc.address, usdcUnits("8.0"), 0);

    await vault.connect(governor).allocate();

    expect(await aaveStrategy.checkBalance(usdc.address)).to.approxEqual(
      usdcUnits("8")
    );

    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("208", 18)
    );

    await dai.connect(josh).approve(vault.address, daiUnits("22.0"));
    await vault.connect(josh).mint(dai.address, daiUnits("22.0"), 0);

    await vault.connect(governor).allocate();

    expect(await aaveStrategy.checkBalance(dai.address)).to.approxEqual(
      daiUnits("222")
    );

    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("230", 18)
    );

    await aaveStrategy.connect(governor).withdrawAll();

    // There should be no DAI or USDC left in wavaxound strategy
    expect(await aaveStrategy.checkBalance(usdc.address)).to.equal(0);
    expect(await aaveStrategy.checkBalance(dai.address)).to.equal(0);

    // Vault value should remain the same because the liquidattion sent the
    // assets back to the vault
    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("230", 18)
    );
  });

  it("Should withdrawAll assets in Strategy and return them to Vault on removal", async () => {
    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("200", 18)
    );

    // Matt deposits USDC, 6 decimals
    await usdc.connect(matt).approve(vault.address, usdcUnits("8.0"));
    await vault.connect(matt).mint(usdc.address, usdcUnits("8.0"), 0);

    await vault.connect(governor).allocate();

    expect(await aaveStrategy.checkBalance(usdc.address)).to.approxEqual(
      usdcUnits("8.0")
    );
    await dai.connect(josh).approve(vault.address, daiUnits("22.0"));
    await vault.connect(josh).mint(dai.address, daiUnits("22.0"), 0);

    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("230", 18)
    );

    await expect(await vault.getStrategyCount()).to.equal(1);

    await vault
      .connect(governor)
      .setAssetDefaultStrategy(usdt.address, addresses.zero);
    await vault
      .connect(governor)
      .setAssetDefaultStrategy(usdc.address, addresses.zero);
    await vault
      .connect(governor)
      .setAssetDefaultStrategy(dai.address, addresses.zero);
    await vault.connect(governor).removeStrategy(aaveStrategy.address);

    await expect(await vault.getStrategyCount()).to.equal(0);

    // Vault value should remain the same because the liquidattion sent the
    // assets back to the vault
    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("230", 18)
    );

    // Should be able to add Strategy back. Proves the struct in the mapping
    // was updated i.e. isSupported set to false
    await vault.connect(governor).approveStrategy(aaveStrategy.address);
  });

  it("Should not alter balances after an asset price change", async () => {
    await usdc.connect(matt).approve(vault.address, usdcUnits("200"));
    await vault.connect(matt).mint(usdc.address, usdcUnits("200"), 0);
    await dai.connect(matt).approve(vault.address, daiUnits("200"));
    await vault.connect(matt).mint(dai.address, daiUnits("200"), 0);

    // 200 XUSD was already minted in the fixture, 100 each for Matt and Josh
    await expectApproxSupply(xusd, xusdUnits("600.0"));
    // 100 + 200 + 200
    await expect(matt).has.an.approxBalanceOf("500", xusd, "Initial");

    await setOracleTokenPriceUsd("USDC", "1.30");
    await vault.rebase();

    await expectApproxSupply(xusd, xusdUnits("600.0"));
    await expect(matt).has.an.approxBalanceOf(
      "500.00",
      xusd,
      "After some assets double"
    );

    await setOracleTokenPriceUsd("USDC", "1.00");
    await vault.rebase();

    await expectApproxSupply(xusd, xusdUnits("600.0"));
    await expect(matt).has.an.approxBalanceOf(
      "500",
      xusd,
      "After assets go back"
    );
  });

  it("Should handle non-standard token deposits", async () => {
    if (nonStandardToken) {
      await vault.connect(governor).supportAsset(nonStandardToken.address);
    }

    await setOracleTokenPriceUsd("NonStandardToken", "1.00");

    await nonStandardToken
      .connect(matt)
      .approve(vault.address, usdtUnits("10000"));

    // Try to mint more than balance, to check failure state
    try {
      await vault
        .connect(matt)
        .mint(nonStandardToken.address, usdtUnits("1200"), 0);
    } catch (err) {
      expect(
        /reverted with reason string 'SafeERC20: ERC20 operation did not succeed/gi.test(
          err.message
        )
      ).to.be.true;
    } finally {
      // Make sure nothing got affected
      await expectApproxSupply(xusd, xusdUnits("200.0"));
      await expect(matt).has.an.approxBalanceOf("100", xusd);
      await expect(matt).has.an.approxBalanceOf("1000", nonStandardToken);
    }

    // Try minting with a valid balance of tokens
    await vault
      .connect(matt)
      .mint(nonStandardToken.address, usdtUnits("100"), 0);
    await expect(matt).has.an.approxBalanceOf("900", nonStandardToken);

    await expectApproxSupply(xusd, xusdUnits("300.0"));
    await expect(matt).has.an.approxBalanceOf("200", xusd, "Initial");
    await vault.rebase();
    await expect(matt).has.an.approxBalanceOf("200", xusd, "After null rebase");
    await setOracleTokenPriceUsd("NonStandardToken", "1.40");
    await vault.rebase();

    await expectApproxSupply(xusd, xusdUnits("300.0"));
    await expect(matt).has.an.approxBalanceOf(
      "200.00",
      xusd,
      "After some assets double"
    );
  });

  it("Should never allocate anything when Vault buffer is 1e18 (100%)", async () => {
    await expect(await vault.getStrategyCount()).to.equal(1);

    // Set a Vault buffer and allocate
    await vault.connect(governor).setVaultBuffer(utils.parseUnits("1", 18));
    await vault.allocate();

    // Verify that nothing went to wavaxound
    await expect(await aaveStrategy.checkBalance(dai.address)).to.equal(0);
  });

  it("Should allocate correctly with DAI when Vault buffer is 1e17 (10%)", async () => {
    const { dai, vault, governor, aaveStrategy } = await loadFixture(
      aaveVaultFixture
    );

    await expect(await vault.getStrategyCount()).to.equal(1);

    // Set a Vault buffer and allocate
    await vault.connect(governor).setVaultBuffer(utils.parseUnits("1", 17));
    await vault.allocate();

    // Verify 80% went to Aave
    await expect(await aaveStrategy.checkBalance(dai.address)).to.approxEqual(
      xusdUnits("180")
    );
    // Remaining 20 should be in Vault
    await expect(await vault.totalValue()).to.approxEqual(xusdUnits("200"));
  });

  it("Should allocate correctly with DAI, USDT, USDC when Vault Buffer is 1e17 (10%)", async () => {
    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("200", 18)
    );

    // Josh deposits DAI, 18 decimals
    await dai.connect(josh).approve(vault.address, daiUnits("22.0"));
    await vault.connect(josh).mint(dai.address, daiUnits("22.0"), 0);
    // Matt deposits USDC, 6 decimals
    await usdc.connect(matt).approve(vault.address, usdcUnits("8.0"));
    await vault.connect(matt).mint(usdc.address, usdcUnits("8.0"), 0);
    // Anna deposits USDT, 6 decimals
    await usdt.connect(anna).approve(vault.address, usdtUnits("20.0"));
    await vault.connect(anna).mint(usdt.address, usdtUnits("20.0"), 0);

    // Set a Vault buffer and allocate
    await vault.connect(governor).setVaultBuffer(utils.parseUnits("1", 17));
    await vault.allocate();

    // Verify 80% went to Aave
    await expect(await aaveStrategy.checkBalance(dai.address)).to.approxEqual(
      daiUnits("199.8")
    );

    await expect(await aaveStrategy.checkBalance(usdc.address)).to.approxEqual(
      usdcUnits("7.2")
    );

    await expect(await aaveStrategy.checkBalance(usdt.address)).to.approxEqual(
      usdtUnits("18")
    );

    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("250", 18)
    );
  });

  it("Should allow transfer of arbitrary token by Governor", async () => {
    // Matt deposits USDC, 6 decimals
    await usdc.connect(matt).approve(vault.address, usdcUnits("8.0"));
    await vault.connect(matt).mint(usdc.address, usdcUnits("8.0"), 0);
    // Matt sends his XUSD directly to Strategy
    await xusd.connect(matt).transfer(aaveStrategy.address, xusdUnits("8.0"));
    // Matt asks Governor for help
    await aaveStrategy
      .connect(governor)
      .transferToken(xusd.address, xusdUnits("8.0"));
    await expect(governor).has.a.balanceOf("8.0", xusd);
  });

  it("Should not allow transfer of arbitrary token by non-Governor", async () => {
    const { aaveStrategy, xusd, matt } = await loadFixture(aaveVaultFixture);
    // Naughty Matt
    await expect(
      aaveStrategy.connect(matt).transferToken(xusd.address, xusdUnits("8.0"))
    ).to.be.revertedWith("Caller is not the Governor");
  });

  it("Should have correct balances on consecutive mint and redeem", async () => {
    const usersWithBalances = [
      [anna, 0],
      [matt, 100],
      [josh, 100],
    ];

    const assetsWithUnits = [
      [dai, daiUnits],
      [usdc, usdcUnits],
    ];

    for (const [user, startBalance] of usersWithBalances) {
      for (const [asset, units] of assetsWithUnits) {
        for (const amount of [5.09, 10.32, 20.99, 100.01]) {
          asset.connect(user).approve(vault.address, units(amount.toString()));
          vault.connect(user).mint(asset.address, units(amount.toString()), 0);
          await expect(user).has.an.approxBalanceOf(
            (startBalance + amount).toString(),
            xusd
          );
          await vault.connect(user).redeem(xusdUnits(amount.toString()), 0);
          await expect(user).has.an.approxBalanceOf(
            startBalance.toString(),
            xusd
          );
        }
      }
    }
  });

  it("Should collect reward tokens using collect rewards on all strategies", async () => {
    const wavaxAmount = utils.parseUnits("100", 18);
    await aaveIncentivesController.setRewardsBalance(
      aaveStrategy.address,
      wavaxAmount
    );
    // Make sure the Strategy has WAVAX balance
    await expect(
      await wavax.balanceOf(await governor.getAddress())
    ).to.be.equal("0");
    await expect(
      await aaveIncentivesController.getRewardsBalance(
        [await aaveIncentivesController.REWARD_TOKEN()],
        aaveStrategy.address
      )
    ).to.be.equal(wavaxAmount);
    await vault.connect(governor)["harvest()"]();

    // Note if Uniswap address was configured, it would withdrawAll the WAVAX for
    // a stablecoin to increase the value of Vault. No Uniswap configured here
    // so the WAVAX just sits in Vault
    await expect(await wavax.balanceOf(vault.address)).to.be.equal(wavaxAmount);
  });

  it("Should collect reward tokens using collect rewards on a specific strategy", async () => {
    const wavaxAmount = utils.parseUnits("100", 18);
    await aaveIncentivesController.setRewardsBalance(
      aaveStrategy.address,
      wavaxAmount
    );

    // Make sure the Strategy has WAVAX balance
    await expect(
      await wavax.balanceOf(await governor.getAddress())
    ).to.be.equal("0");
    await expect(
      await aaveIncentivesController.getRewardsBalance(
        [await aaveIncentivesController.REWARD_TOKEN()],
        aaveStrategy.address
      )
    ).to.be.equal(wavaxAmount);

    // prettier-ignore
    await vault.connect(governor)["harvest(address)"](aaveStrategy.address);

    await expect(await wavax.balanceOf(vault.address)).to.be.equal(wavaxAmount);
  });

  it("Should collect reward tokens and swap via Uniswap", async () => {
    const mockUniswapRouter = await ethers.getContract("MockUniswapRouter");

    await mockUniswapRouter.initialize(wavax.address, usdt.address);

    const wavaxAmount = utils.parseUnits("100", 18);
    await aaveIncentivesController.setRewardsBalance(
      aaveStrategy.address,
      wavaxAmount
    );

    await vault.connect(governor).setUniswapAddr(mockUniswapRouter.address);

    // Add Aave to the Vault as a token that should be swapped
    await vault.connect(governor).addSwapToken(wavax.address);

    // Make sure Vault has 0 USDT balance
    await expect(vault).has.a.balanceOf("0", usdt);

    // Make sure the Strategy has WAVAX balance
    await expect(
      await wavax.balanceOf(await governor.getAddress())
    ).to.be.equal("0");
    await expect(
      await aaveIncentivesController.getRewardsBalance([], aaveStrategy.address)
    ).to.be.equal(wavaxAmount);

    // Give Uniswap mock some USDT so it can give it back in WAVAX liquidation
    await usdt
      .connect(josh)
      .transfer(mockUniswapRouter.address, usdtUnits("100"));

    // prettier-ignore
    await vault.connect(governor)["harvestAndSwap()"]();

    // No WAVAX in Vault or Aave strategy
    await expect(vault).has.a.balanceOf("0", wavax);
    await expect(
      await aaveIncentivesController.getRewardsBalance(
        [wavax.address],
        aaveStrategy.address
      )
    ).to.be.equal(0);
    await expect(await wavax.balanceOf(aaveStrategy.address)).to.be.equal("0");
    await expect(await wavax.balanceOf(vault.address)).to.be.equal("0");

    // Make sure Vault has 100 USDT balance (the Uniswap mock converts at 100:1)
    await expect(vault).has.a.balanceOf("100", usdt);
  });

  it("Should not swap if slippage is too high", async () => {
    const mockUniswapRouter = await ethers.getContract("MockUniswapRouter");

    // Mock router gives 1:1, if we set this to something high there will be
    // too much slippage
    await mockUniswapRouter.initialize(wavax.address, usdt.address);

    const oracleAddresses = await getOracleAddresses(hre.deployments);
    await oracleRouter.setFeed(
      wavax.address,
      oracleAddresses.chainlink.WAVAX_USD
    );
    await mockUniswapRouter.initialize(wavax.address, usdt.address);
    await setOracleTokenPriceUsd("WAVAX", "1.3");

    const wavaxAmount = utils.parseUnits("100", 18);
    await aaveIncentivesController.setRewardsBalance(
      aaveStrategy.address,
      wavaxAmount
    );

    await vault.connect(governor).setUniswapAddr(mockUniswapRouter.address);

    // Add Aave to the Vault as a token that should be swapped
    await vault.connect(governor).addSwapToken(wavax.address);

    // Make sure Vault has 0 USDT balance
    await expect(vault).has.a.balanceOf("0", usdt);

    // Make sure the Strategy has WAVAX balance
    await expect(
      await wavax.balanceOf(await governor.getAddress())
    ).to.be.equal("0");
    await expect(
      await aaveIncentivesController.getRewardsBalance([], aaveStrategy.address)
    ).to.be.equal(wavaxAmount);

    // Give Uniswap mock some USDT so it can give it back in WAVAX liquidation
    await usdt
      .connect(josh)
      .transfer(mockUniswapRouter.address, usdtUnits("100"));

    // prettier-ignore
    await expect(vault
      .connect(governor)["harvestAndSwap()"]()).to.be.revertedWith("Slippage error");
  });

  it("Should collect reward tokens and swap as separate calls", async () => {
    const mockUniswapRouter = await ethers.getContract("MockUniswapRouter");
    await mockUniswapRouter.initialize(wavax.address, usdt.address);

    const wavaxAmount = utils.parseUnits("100", 18);
    await aaveIncentivesController.setRewardsBalance(
      aaveStrategy.address,
      wavaxAmount
    );

    await vault.connect(governor).setUniswapAddr(mockUniswapRouter.address);

    // Add Aave to the Vault as a token that should be swapped
    await vault.connect(governor).addSwapToken(wavax.address);

    // Make sure Vault has 0 USDT balance
    await expect(vault).has.a.balanceOf("0", usdt);

    // Make sure the Strategy has WAVAX balance
    await expect(
      await wavax.balanceOf(await governor.getAddress())
    ).to.be.equal("0");
    await expect(
      await aaveIncentivesController.getRewardsBalance([], aaveStrategy.address)
    ).to.be.equal(wavaxAmount);

    // Give Uniswap mock some USDT so it can give it back in WAVAX liquidation
    await usdt
      .connect(josh)
      .transfer(mockUniswapRouter.address, usdtUnits("100"));

    // prettier-ignore
    await vault.connect(governor)["harvest()"]();

    // WAVAX should be sitting in Vault
    await expect(await wavax.balanceOf(vault.address)).to.be.equal(wavaxAmount);
    // Call the swap
    await vault.connect(governor)["swap()"]();

    // Make sure Vault has 100 USDT balance (the Uniswap mock converts at 100:1)
    await expect(vault).has.a.balanceOf("100", usdt);

    // No WAVAX in Vault or Aave strategy
    await expect(vault).has.a.balanceOf("0", wavax);
    await expect(await wavax.balanceOf(aaveStrategy.address)).to.be.equal("0");
  });
});

describe("Vault auto allocation", async () => {
  if (isFork) {
    this.timeout(0);
  }

  let anna, vault, governor, usdc, dai, usdt;

  beforeEach(async function () {
    const fixture = await aaveVaultFixture();
    anna = fixture.anna;
    vault = fixture.vault;
    usdc = fixture.usdc;
    usdt = fixture.usdt;
    dai = fixture.dai;
    governor = fixture.governor;
  });

  const mintDoesAllocate = async (amount) => {
    await vault.connect(governor).setVaultBuffer(0);
    await vault.allocate();
    await usdc.connect(anna).mint(usdcUnits(amount));
    await usdc.connect(anna).approve(vault.address, usdcUnits(amount));
    await vault.connect(anna).mint(usdc.address, usdcUnits(amount), 0);
    return (await usdc.balanceOf(vault.address)).isZero();
  };

  const setThreshold = async (amount) => {
    await vault.connect(governor).setAutoAllocateThreshold(xusdUnits(amount));
  };

  it("Triggers auto allocation at the threshold", async () => {
    await setThreshold("25000");
    expect(await mintDoesAllocate("25000")).to.be.true;
  });

  it("Alloc with both threshhold and buffer", async () => {
    const initialValue = (await vault.totalValue()).toString();
    await expect(initialValue).to.be.equal(
      utils.parseUnits("200", 18),
      // FIXME: change expects to relative values instead of relying on initial state
      "confirm initial state of vault"
    );
    await vault.allocate();
    await vault.connect(governor).setVaultBuffer(utils.parseUnits("1", 17));
    await vault.connect(governor).setAutoAllocateThreshold(xusdUnits("3"));
    // DAI was allocated before the vault buffer was set
    await expect(await dai.balanceOf(vault.address)).to.equal(daiUnits("0"));
    // USDC was allocated before the vault buffer was set
    await expect(await usdc.balanceOf(vault.address)).to.equal(usdcUnits("0"));
    // USDT was allocated before the vault buffer was set
    await expect(await usdt.balanceOf(vault.address)).to.equal(usdtUnits("0"));

    const amount = "4";
    await usdc.connect(anna).mint(usdcUnits(amount));
    await usdc.connect(anna).approve(vault.address, usdcUnits(amount));
    await vault.connect(anna).mint(usdc.address, usdcUnits(amount), 0);
    await expect(await usdc.balanceOf(vault.address)).to.equal(
      usdcUnits(amount)
    );
    // No allocate triggered due to threshold so call manually
    await vault.allocate();

    // 5 should be below the 10% vault buffer (4/204 * 100 = 1.96%)
    // All funds should remain in vault
    await expect(await usdc.balanceOf(vault.address)).to.equal(
      usdcUnits(amount)
    );
    // DAI was allocated before the vault buffer was set
    await expect(await dai.balanceOf(vault.address)).to.equal(daiUnits("0"));

    // Use an amount above the vault buffer size that will trigger an allocate
    const allocAmount = "5000";
    await usdc.connect(anna).mint(usdcUnits(allocAmount));
    await usdc.connect(anna).approve(vault.address, usdcUnits(allocAmount));
    await vault.connect(anna).mint(usdc.address, usdcUnits(allocAmount), 0);

    // We should take 10% off for the buffer
    // 10% * 5204 + what we started with
    await expect(await usdc.balanceOf(vault.address)).to.equal(
      usdcUnits("520.4")
    );

    const minAmount = "0.000001";
    await usdc.connect(anna).mint(usdcUnits(minAmount));
    await usdc.connect(anna).approve(vault.address, usdcUnits(minAmount));
    await vault.connect(anna).mint(usdc.address, usdcUnits(minAmount), 0);

    //alloc should not crash here
    await expect(vault.allocate()).not.to.be.reverted;
  });

  it("Triggers auto allocation above the threshold", async () => {
    await setThreshold("25000");
    expect(await mintDoesAllocate("25001")).to.be.true;
  });

  it("Does not trigger auto allocation below the threshold", async () => {
    await setThreshold("25000");
    expect(await mintDoesAllocate("24999")).to.be.false;
  });

  it("Governor can change the threshold", async () => {
    await setThreshold("25000");
  });

  it("Non-governor cannot change the threshold", async () => {
    await expect(vault.connect(anna).setAutoAllocateThreshold(10000)).to.be
      .reverted;
  });
});

describe("Vault with two Aave strategies", function () {
  if (isFork) {
    this.timeout(0);
  }

  it("Should reallocate from one strategy to another", async () => {
    const { vault, dai, governor, aaveStrategy, strategyTwo } =
      await loadFixture(multiStrategyVaultFixture);

    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("200", 18)
    );

    await vault.allocate();
    expect(await aaveStrategy.checkBalance(dai.address)).to.equal(
      daiUnits("0")
    );
    expect(await strategyTwo.checkBalance(dai.address)).to.equal(
      daiUnits("200")
    );

    await vault
      .connect(governor)
      .reallocate(
        strategyTwo.address,
        aaveStrategy.address,
        [dai.address],
        [daiUnits("200")]
      );

    expect(await aaveStrategy.checkBalance(dai.address)).to.equal(
      daiUnits("200")
    );
    expect(await strategyTwo.checkBalance(dai.address)).to.equal(daiUnits("0"));
  });

  it("Should not reallocate to a strategy that does not support the asset", async () => {
    const { vault, usdt, josh, governor, aaveStrategy, strategyTwo } =
      await loadFixture(multiStrategyVaultFixture);

    expect(await vault.totalValue()).to.approxEqual(
      utils.parseUnits("200", 18)
    );

    // AaveStrategy supports DAI, USDT and USDC but StrategyTwo only
    // supports DAI and USDC, see aaveVaultFixture() and
    // multiStrategyVaultFixture() in test/_fixture.js

    // Stick 200 USDT in AaveStrategy via mint and allocate
    await usdt.connect(josh).approve(vault.address, usdtUnits("200"));
    await vault.connect(josh).mint(usdt.address, usdtUnits("200"), 0);
    await vault.allocate();

    expect(await aaveStrategy.checkBalance(usdt.address)).to.equal(
      usdtUnits("200")
    );

    await expect(
      vault
        .connect(governor)
        .reallocate(
          aaveStrategy.address,
          strategyTwo.address,
          [usdt.address],
          [usdtUnits("200")]
        )
    ).to.be.revertedWith("Asset unsupported");
  });

  it("Should not reallocate to strategy that has not been added to the Vault", async () => {
    const { vault, dai, governor, aaveStrategy, strategyThree } =
      await loadFixture(multiStrategyVaultFixture);
    await expect(
      vault
        .connect(governor)
        .reallocate(
          aaveStrategy.address,
          strategyThree.address,
          [dai.address],
          [daiUnits("200")]
        )
    ).to.be.revertedWith("Invalid to Strategy");
  });

  it("Should not reallocate from strategy that has not been added to the Vault", async () => {
    const { vault, dai, governor, aaveStrategy, strategyThree } =
      await loadFixture(multiStrategyVaultFixture);
    await expect(
      vault
        .connect(governor)
        .reallocate(
          strategyThree.address,
          aaveStrategy.address,
          [dai.address],
          [daiUnits("200")]
        )
    ).to.be.revertedWith("Invalid from Strategy");
  });
});
