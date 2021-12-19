const { expect } = require("chai");
const { utils } = require("ethers");

const { defaultFixture } = require("../_fixture");
const { xusdUnits, usdcUnits, loadFixture } = require("../helpers");

describe("OGN Buyback", function () {
  it("Should allow Governor to set Trustee address", async () => {
    const { vault, governor, xusd } = await loadFixture(defaultFixture);
    // Pretend XUSD is trustee
    await vault.connect(governor).setTrusteeAddress(xusd.address);
  });

  it("Should not allow non-Governor to set Trustee address", async () => {
    const { vault, anna, xusd } = await loadFixture(defaultFixture);
    // Pretend XUSD is trustee
    await expect(
      vault.connect(anna).setTrusteeAddress(xusd.address)
    ).to.be.revertedWith("Caller is not the Governor");
  });

  it("Should swap XUSD balance for OGN", async () => {
    const fixture = await loadFixture(defaultFixture);
    const { xusd, ogn, governor, buyback, vault } = fixture;
    await fundBuybackAndUniswap(fixture);

    // Calling allocate on Vault calls buyback.swap()
    await vault.connect(governor).allocate();
    await expect(buyback).has.a.balanceOf("1000", ogn);
    await expect(buyback).has.a.balanceOf("0", xusd);
  });

  it("Should not swap XUSD if the prices are wrong", async () => {
    const fixture = await loadFixture(defaultFixture);
    const { ogn, xusd, governor, buyback, vault, chainlinkOracleFeedOGNETH } =
      fixture;
    await fundBuybackAndUniswap(fixture);

    // Our mock uniswap is set to trade at 1 OGN = 1 XUSD
    // If we set the price of OGN to 0.80, then we would expect 1,250 OGN
    // in return for 1,000 XUSD.
    // 1 ETH = 4000 USD, 1 OGN = 0.0002 ETH is 0.80
    await chainlinkOracleFeedOGNETH.setPrice(utils.parseUnits("0.0002", 18));

    // Calling allocate on Vault calls buyback.swap()
    await vault.connect(governor).allocate();
    // No OGN bought back, XUSD remains
    await expect(buyback).has.a.balanceOf("0", ogn);
    await expect(buyback).has.a.balanceOf("1000", xusd);
  });

  it("Should allow withdrawal of arbitrary token by Governor", async () => {
    const { vault, xusd, usdc, matt, governor, buyback } = await loadFixture(
      defaultFixture
    );
    // Matt deposits USDC, 6 decimals
    await usdc.connect(matt).approve(vault.address, usdcUnits("8.0"));
    await vault.connect(matt).mint(usdc.address, usdcUnits("8.0"), 0);
    // Matt sends his XUSD directly to Vault
    await xusd.connect(matt).transfer(buyback.address, xusdUnits("8.0"));
    // Matt asks Governor for help
    await buyback
      .connect(governor)
      .transferToken(xusd.address, xusdUnits("8.0"));
    await expect(governor).has.a.balanceOf("8.0", xusd);
  });

  it("Should not allow withdrawal of arbitrary token by non-Governor", async () => {
    const { vault, xusd, matt } = await loadFixture(defaultFixture);
    // Naughty Matt
    await expect(
      vault.connect(matt).transferToken(xusd.address, xusdUnits("8.0"))
    ).to.be.revertedWith("Caller is not the Governor");
  });
});

async function fundBuybackAndUniswap(fixture) {
  const { matt, ogn, xusd, buyback, dai, vault } = fixture;
  const mockUniswapRouter = await ethers.getContract("MockUniswapRouter");
  mockUniswapRouter.initialize(xusd.address, ogn.address);

  // Give Uniswap mock some OGN so it can swap
  await ogn.connect(matt).mint(utils.parseUnits("1000", 18));
  await ogn
    .connect(matt)
    .transfer(mockUniswapRouter.address, utils.parseUnits("1000", 18));
  // Get XUSD for the buyback contract to use
  await dai.connect(matt).mint(utils.parseUnits("1000", 18));
  await dai.connect(matt).approve(vault.address, utils.parseUnits("1000", 18));
  await vault.connect(matt).mint(dai.address, utils.parseUnits("1000", 18), 0);
  // Give the Buyback contract some XUSD to trigger the swap
  await xusd
    .connect(matt)
    .transfer(buyback.address, utils.parseUnits("1000", 18));
}
