const hre = require("hardhat");
const { utils } = require("ethers");

const addresses = require("./addresses");
const daiAbi = require("../test/abi/dai.json").abi;
const usdtAbi = require("../test/abi/usdt.json").abi;
const usdcAbi = require("../test/abi/erc20.json");
const tusdAbi = require("../test/abi/erc20.json");

const {
  usdtUnits,
  daiUnits,
  usdcUnits,
  tusdUnits,
  isFork,
} = require("../test/helpers");

const fundAccounts = async () => {
  let usdt, dai, tusd, usdc, nonStandardToken;
  if (isFork) {
    usdt = await ethers.getContractAt(usdtAbi, addresses.mainnet.USDT);
    dai = await ethers.getContractAt(daiAbi, addresses.mainnet.DAI);
    usdc = await ethers.getContractAt(usdcAbi, addresses.mainnet.USDC);
    tusd = await ethers.getContractAt(tusdAbi, addresses.mainnet.TUSD);
  } else {
    usdt = await ethers.getContract("MockUSDT");
    dai = await ethers.getContract("MockDAI");
    usdc = await ethers.getContract("MockUSDC");
    tusd = await ethers.getContract("MockTUSD");
    nonStandardToken = await ethers.getContract("MockNonStandardToken");
  }

  let binanceSigner;
  const signers = await hre.ethers.getSigners();
  const { governorAddr } = await getNamedAccounts();

  if (isFork) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [addresses.mainnet.Binance],
    });
    binanceSigner = await ethers.provider.getSigner(addresses.mainnet.Binance);
    // Send some Ethereum to Governor
    await binanceSigner.sendTransaction({
      to: governorAddr,
      value: utils.parseEther("100"),
    });
  }

  for (let i = 0; i < 10; i++) {
    if (isFork) {
      await dai
        .connect(binanceSigner)
        .transfer(await signers[i].getAddress(), daiUnits("1000"));
      await usdc
        .connect(binanceSigner)
        .transfer(await signers[i].getAddress(), usdcUnits("1000"));
      await usdt
        .connect(binanceSigner)
        .transfer(await signers[i].getAddress(), usdtUnits("1000"));
      await tusd
        .connect(binanceSigner)
        .transfer(await signers[i].getAddress(), tusdUnits("1000"));
    } else {
      await dai.connect(signers[i]).mint(daiUnits("1000"));
      await usdc.connect(signers[i]).mint(usdcUnits("1000"));
      await usdt.connect(signers[i]).mint(usdtUnits("1000"));
      await tusd.connect(signers[i]).mint(tusdUnits("1000"));
      await nonStandardToken.connect(signers[i]).mint(usdtUnits("1000"));
    }
  }

  if (isFork) {
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [addresses.mainnet.Binance],
    });
  }
};

module.exports = fundAccounts;
