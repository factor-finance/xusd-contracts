const { defaultFixture } = require("../_fixture");
const { expect } = require("chai");
const {
  daiUnits,
  xusdUnits,
  usdcUnits,
  usdtUnits,
  loadFixture,
  isFork,
} = require("../helpers");
const { parseUnits } = require("ethers/lib/utils");

describe("Flipper", async function () {
  if (isFork) {
    this.timeout(0);
  }

  describe("Trading Success", () => {
    withEachCoinIt("converts to XUSD and back", async (fixture) => {
      const { matt, flipper, xusd, stablecoin, titleName } = fixture;
      await expect(matt).balanceOf("1000", stablecoin);
      await expect(matt).balanceOf("100", xusd);
      await flipper.connect(matt)[`buyXusdWith${titleName}`](xusdUnits("30"));
      await expect(matt).balanceOf("970", stablecoin);
      await expect(matt).balanceOf("130", xusd);
      await flipper.connect(matt)[`sellXusdFor${titleName}`](xusdUnits("30"));
      await expect(matt).balanceOf("1000", stablecoin);
      await expect(matt).balanceOf("100", xusd);
    });
  });

  describe("Trading should fail if no stable", () => {
    withEachCoinIt(
      "exchange throws if contract has no stablecoins to sell for",
      async (fixture) => {
        const { matt, flipper, governor, stablecoin, titleName } = fixture;
        const balance = await stablecoin.balanceOf(flipper.address);
        await flipper.connect(governor).withdraw(stablecoin.address, balance);
        await expect(flipper).balanceOf("0", stablecoin);
        const call = flipper.connect(matt)[
          // eslint-disable-next-line
          `sellXusdFor${titleName}`
        ](xusdUnits("1"));
        await expect(call).to.be.revertedWith(
          "ERC20: transfer amount exceeds balance"
        );
      }
    );
  });

  describe("Trading should fail if no XUSD", () => {
    withEachCoinIt(
      "exchange throws if contract has no XUSD to buy",
      async (fixture) => {
        const { matt, flipper, governor, xusd, titleName } = fixture;
        const balance = await xusd.balanceOf(flipper.address);
        await flipper.connect(governor).withdraw(xusd.address, balance);
        await expect(flipper).balanceOf("0", xusd);
        const call = flipper.connect(matt)[
          // eslint-disable-next-line
          `buyXusdWith${titleName}`
        ](xusdUnits("1"));
        await expect(call).to.be.revertedWith("Transfer greater than balance");
      }
    );
  });

  describe("Trading should fail if over the max limit", () => {
    withEachCoinIt("over max limit", async (fixture) => {
      const { matt, flipper, stablecoin, titleName } = fixture;
      await stablecoin
        .connect(matt)
        .mint(parseUnits("30000", await stablecoin.decimals()));

      // Buy should fail, over max
      const buy = flipper.connect(matt)[
        // eslint-disable-next-line
        `buyXusdWith${titleName}`
      ](xusdUnits("25001"));
      await expect(buy).to.be.revertedWith("Amount too large");
      // ...Should succeed, on the line for the limit
      await flipper.connect(matt)[
        // eslint-disable-next-line
        `buyXusdWith${titleName}`
      ](xusdUnits("25000"));
      // Sell should fail, over max
      const sell = flipper.connect(matt)[
        // eslint-disable-next-line
        `sellXusdFor${titleName}`
      ](xusdUnits("25001"));
      await expect(sell).to.be.revertedWith("Amount too large");
      // ... Should succeed, on the line for the limit
      await flipper.connect(matt)[
        // eslint-disable-next-line
        `sellXusdFor${titleName}`
      ](xusdUnits("25000"));
    });
  });

  describe("Withdraw tokens", () => {
    describe("Success cases", () => {
      withEachCoinIt("can be withdrawn partialy", async (fixture) => {
        const { governor, flipper, stablecoin } = fixture;
        await expect(governor).balanceOf("1000", stablecoin);
        await expect(flipper).balanceOf("50000", stablecoin);
        const amount = parseUnits("12345", await stablecoin.decimals());
        await flipper.connect(governor).withdraw(stablecoin.address, amount);
        await expect(governor).balanceOf("13345", stablecoin);
        await expect(flipper).balanceOf("37655", stablecoin);
      });

      it("XUSD can be withdrawn partialy", async () => {
        const { governor, xusd, flipper } = await loadFixture(loadedFlipper);
        await expect(governor).balanceOf("0", xusd);
        await expect(flipper).balanceOf("50000", xusd);
        const amount = xusdUnits("12345");
        await flipper.connect(governor).withdraw(xusd.address, amount);
        await expect(governor).balanceOf("12345", xusd);
        await expect(flipper).balanceOf("37655", xusd);
      });

      withEachCoinIt("can be withdrawn completely", async (fixture) => {
        const { governor, flipper, stablecoin } = fixture;
        await expect(governor).balanceOf("1000", stablecoin);
        await expect(flipper).balanceOf("50000", stablecoin);
        const amount = await stablecoin.balanceOf(flipper.address);
        await flipper.connect(governor).withdraw(stablecoin.address, amount);
        await expect(governor).balanceOf("51000", stablecoin);
        await expect(flipper).balanceOf("0", stablecoin);
      });

      it("XUSD can be withdrawn completely", async () => {
        const { governor, xusd, flipper } = await loadFixture(loadedFlipper);
        await expect(governor).balanceOf("0", xusd);
        await expect(flipper).balanceOf("50000", xusd);
        const amount = await xusd.balanceOf(flipper.address);
        await flipper.connect(governor).withdraw(xusd.address, amount);
        await expect(governor).balanceOf("50000", xusd);
        await expect(flipper).balanceOf("0", xusd);
      });

      it("Supports withdraw all", async () => {
        const fixture = await loadFixture(loadedFlipper);
        const { governor, dai, xusd, usdt, usdc, flipper } = fixture;

        // Make each token have a different , xusdUnits("13") to be able to catch
        // if the contract uses the balance of the wrong contract.
        await flipper.connect(governor).withdraw(dai.address, daiUnits("11"));
        await flipper.connect(governor).withdraw(xusd.address, xusdUnits("12"));
        await flipper.connect(governor).withdraw(usdc.address, usdcUnits("13"));
        await flipper.connect(governor).withdraw(usdt.address, usdtUnits("14"));

        await flipper.connect(governor).withdrawAll();
        await expect(flipper).balanceOf("0", dai);
        await expect(flipper).balanceOf("0", xusd);
        await expect(flipper).balanceOf("0", usdc);
        await expect(flipper).balanceOf("0", usdt);

        await expect(governor).balanceOf("51000", dai);
        await expect(governor).balanceOf("50000", xusd);
        await expect(governor).balanceOf("51000", usdc);
        await expect(governor).balanceOf("51000", usdt);
      });
    });

    describe("Failure cases", async () => {
      it("Only governer can withdraw", async () => {
        const { matt, usdc, flipper } = await loadFixture(loadedFlipper);
        const call = flipper.connect(matt).withdraw(usdc.address, 1);
        expect(call).to.be.revertedWith("Caller is not the Governor");
      });
      it("Only governer can withdrawAll", async () => {
        const { matt, flipper } = await loadFixture(loadedFlipper);
        const call = flipper.connect(matt).withdrawAll();
        expect(call).to.be.revertedWith("Caller is not the Governor");
      });
    });
  });

  describe("Rebase Opt-In", async () => {
    it("can opt-in to rebasing for gas savings", async () => {
      const { flipper, governor } = await loadFixture(loadedFlipper);
      await flipper.connect(governor).rebaseOptIn();
    });
  });
});

async function loadedFlipper() {
  const fixture = await loadFixture(defaultFixture);
  const { xusd, dai, usdc, usdt, flipper, vault, matt } = fixture;

  await dai.connect(matt).mint(daiUnits("50100"));
  await usdc.connect(matt).mint(usdcUnits("100000"));
  await usdt.connect(matt).mint(usdtUnits("50000"));
  await usdc.connect(matt).approve(vault.address, usdcUnits("990000"));
  await vault.connect(matt).mint(usdc.address, usdcUnits("50000"), 0);

  await dai.connect(matt).transfer(flipper.address, daiUnits("50000"));
  await xusd.connect(matt).transfer(flipper.address, xusdUnits("50000"));
  await usdc.connect(matt).transfer(flipper.address, usdcUnits("50000"));
  await usdt.connect(matt).transfer(flipper.address, usdtUnits("50000"));

  await dai.connect(matt).approve(flipper.address, daiUnits("990000"));
  await xusd.connect(matt).approve(flipper.address, xusdUnits("990000"));
  await usdc.connect(matt).approve(flipper.address, usdcUnits("990000"));
  await usdt.connect(matt).approve(flipper.address, usdtUnits("990000"));

  return fixture;
}

function withEachCoinIt(title, fn) {
  const stablecoins = ["DAI", "USDC", "USDT"];
  for (const name of stablecoins) {
    it(`${name} ${title}`, async () => {
      const fixture = await loadFixture(loadedFlipper);
      const stablecoin = fixture[name.toLowerCase()];
      const titleName = name.charAt(0) + name.slice(1).toLowerCase();
      const params = { ...fixture, ...{ stablecoin, titleName } };
      await fn(params);
    });
  }
}
